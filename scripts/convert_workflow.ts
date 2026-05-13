/**
 * Convert a ComfyUI UI-format workflow JSON to API-format (prompt dict).
 * Fetches node schemas from a running ComfyUI instance to correctly resolve
 * widget names, including new-style "COMBO" inputs and the hidden
 * `control_after_generate` widget that follows every seed/noise_seed INT input.
 *
 * Usage:
 *   npx tsx scripts/convert_workflow.ts <input_ui.json> <output_api.json> [comfy_url]
 *   Default comfy_url: http://127.0.0.1:8188
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UiLink {
  0: number; // link_id
  1: number; // src_node_id
  2: number; // src_output_slot
  3: number; // dst_node_id
  4: number; // dst_input_slot
}

interface UiInput {
  name: string;
  type?: string;
  link?: number | null;
}

interface UiOutput {
  name?: string;
  type?: string;
  links?: number[] | null;
}

interface UiNode {
  id: number;
  type: string;
  mode?: number; // 4 = muted/bypassed
  inputs?: UiInput[];
  outputs?: UiOutput[];
  widgets_values?: unknown[];
}

interface UiWorkflow {
  nodes: UiNode[];
  links: UiLink[];
}

interface ApiNode {
  class_type: string;
  inputs: Record<string, unknown>;
}

type InputSpec = [string | string[], Record<string, unknown>?];
type NodeSchema = { input?: { required?: Record<string, InputSpec>; optional?: Record<string, InputSpec> } };
type ObjectInfo = Record<string, NodeSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

/** UI-only nodes that carry no data — safe to drop from API format */
const UI_ONLY_TYPES = new Set([
  'Fast Groups Bypasser (rgthree)',
  'MarkdownNote',
  'Note',
  'PrimitiveNode',
]);

/** INT widget names after which ComfyUI injects a hidden control_after_generate */
const SEED_WIDGET_NAMES = new Set(['seed', 'noise_seed']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchObjectInfo(baseUrl: string): Promise<ObjectInfo> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/object_info`);
  if (!res.ok) throw new Error(`/object_info returned ${res.status}`);
  return res.json() as Promise<ObjectInfo>;
}

/** Returns ordered list of (name, isInt) for all widget inputs of a node schema. */
function getWidgetInputs(schema: NodeSchema): Array<{ name: string; isInt: boolean }> {
  const required = schema?.input?.required ?? {};
  const optional = schema?.input?.optional ?? {};
  const result: Array<{ name: string; isInt: boolean }> = [];

  for (const [name, spec] of Object.entries({ ...required, ...optional })) {
    const inputType = spec?.[0];
    if (Array.isArray(inputType)) {
      result.push({ name, isInt: false });               // old-style COMBO: spec[0] is options array
    } else if (inputType === 'COMBO') {
      result.push({ name, isInt: false });               // new-style COMBO: spec[0] == "COMBO" string
    } else if (inputType === 'INT') {
      result.push({ name, isInt: true });
    } else if (inputType === 'FLOAT' || inputType === 'STRING' || inputType === 'BOOLEAN') {
      result.push({ name, isInt: false });
    }
  }
  return result;
}

// ─── Converter ────────────────────────────────────────────────────────────────

function convert(ui: UiWorkflow, objectInfo: ObjectInfo): Record<string, ApiNode> {
  // Build a node-id index first so we can resolve through bypassed nodes.
  const nodeById = new Map<number, UiNode>();
  for (const node of ui.nodes) nodeById.set(node.id, node);

  // link_id → [srcNodeId, srcSlot] — resolved through bypass chains.
  // ComfyUI bypass semantics: when a node has mode=4, each output is forwarded
  // to the FIRST input with the same TYPE. We follow that chain until we hit a
  // non-bypassed source (or a dead end).
  const rawLinkMap = new Map<number, [number, number]>(); // numeric ids first
  for (const link of ui.links) {
    rawLinkMap.set(link[0], [link[1], link[2]]);
  }

  function resolveLink(linkId: number, depth = 0): [string, number] | null {
    if (depth > 32) return null;                          // cycle guard
    const raw = rawLinkMap.get(linkId);
    if (!raw) return null;
    const [srcId, srcSlot] = raw;
    const srcNode = nodeById.get(srcId);
    if (!srcNode) return null;
    if (srcNode.mode !== 4 && !UI_ONLY_TYPES.has(srcNode.type)) {
      return [String(srcId), srcSlot];                    // real source
    }
    // Bypassed/dropped — pass through by matching output→input by type
    const out = srcNode.outputs?.[srcSlot];
    if (!out) return null;
    const passInput = (srcNode.inputs ?? []).find(
      (inp) => inp.type === out.type && inp.link != null,
    );
    if (!passInput || passInput.link == null) return null;
    return resolveLink(passInput.link, depth + 1);
  }

  const linkMap = new Map<number, [string, number]>();
  for (const linkId of rawLinkMap.keys()) {
    const r = resolveLink(linkId);
    if (r) linkMap.set(linkId, r);
  }

  const api: Record<string, ApiNode> = {};

  for (const node of ui.nodes) {
    if (node.mode === 4) continue;                        // muted / bypassed
    if (UI_ONLY_TYPES.has(node.type)) continue;

    const schema = objectInfo[node.type] ?? {};
    const widgetInputs = getWidgetInputs(schema);

    // Map slot name → link_id (only connected slots)
    const slotLinks = new Map<string, number>();
    for (const inp of node.inputs ?? []) {
      if (inp.link != null) slotLinks.set(inp.name, inp.link);
    }

    const widgetValues = [...(node.widgets_values ?? [])];
    let valIdx = 0;
    const resolved: Record<string, unknown> = {};

    for (const { name, isInt } of widgetInputs) {
      const linkId = slotLinks.get(name);
      if (linkId != null) {
        // Connected via link — pull value from source node
        const src = linkMap.get(linkId);
        if (src) resolved[name] = src;
      } else {
        resolved[name] = valIdx < widgetValues.length ? widgetValues[valIdx] : null;
      }
      valIdx++;

      // Skip the hidden control_after_generate that follows every seed INT
      if (isInt && SEED_WIDGET_NAMES.has(name)) valIdx++;
    }

    // Apply remaining linked slots not already in resolved (node-type inputs)
    for (const [name, linkId] of slotLinks) {
      if (!(name in resolved)) {
        const src = linkMap.get(linkId);
        if (src) resolved[name] = src;
      }
    }

    // Drop the node if it had a connected input that couldn't be resolved
    // (its upstream chain is fully bypassed → effectively disconnected).
    let orphaned = false;
    for (const [name, linkId] of slotLinks) {
      const src = linkMap.get(linkId);
      if (!src) {
        const required = schema?.input?.required ?? {};
        if (name in required) { orphaned = true; break; }
      }
    }
    if (orphaned) continue;

    api[String(node.id)] = { class_type: node.type, inputs: resolved };
  }

  return api;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [, , srcArg, dstArg, comfyUrl = 'http://127.0.0.1:8188'] = process.argv;

  if (!srcArg || !dstArg) {
    console.error('Usage: npx tsx scripts/convert_workflow.ts <input_ui.json> <output_api.json> [comfy_url]');
    process.exit(1);
  }

  console.log(`Fetching node schemas from ${comfyUrl} ...`);
  const objectInfo = await fetchObjectInfo(comfyUrl);

  const ui = JSON.parse(readFileSync(srcArg, 'utf-8')) as UiWorkflow;
  const apiWorkflow = convert(ui, objectInfo);

  mkdirSync(dirname(dstArg), { recursive: true });
  writeFileSync(dstArg, JSON.stringify(apiWorkflow, null, 2), 'utf-8');
  console.log(`Converted ${Object.keys(apiWorkflow).length} nodes -> ${dstArg}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
