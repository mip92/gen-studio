/**
 * Print a summary of all nodes in a ComfyUI API-format workflow JSON.
 *
 * Usage:
 *   npx tsx scripts/check_nodes.ts <api_workflow.json>
 */

import { readFileSync } from 'fs';

interface ApiNode {
  class_type: string;
  inputs: Record<string, unknown>;
}

const [, , src] = process.argv;
if (!src) {
  console.error('Usage: npx tsx scripts/check_nodes.ts <api_workflow.json>');
  process.exit(1);
}

const workflow = JSON.parse(readFileSync(src, 'utf-8')) as Record<string, ApiNode>;

const rows = Object.entries(workflow).sort((a, b) => Number(a[0]) - Number(b[0]));
const idWidth  = Math.max(...rows.map(([id]) => id.length), 2);
const typeWidth = Math.max(...rows.map(([, n]) => n.class_type.length), 10);

console.log(
  `${'ID'.padEnd(idWidth)}  ${'class_type'.padEnd(typeWidth)}  inputs`,
);
console.log('─'.repeat(idWidth + typeWidth + 40));

for (const [id, node] of rows) {
  const preview = JSON.stringify(node.inputs).slice(0, 100);
  console.log(`${id.padEnd(idWidth)}  ${node.class_type.padEnd(typeWidth)}  ${preview}`);
}

console.log(`\nTotal: ${rows.length} nodes`);
