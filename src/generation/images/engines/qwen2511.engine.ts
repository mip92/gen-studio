import { BadRequestException } from '@nestjs/common';
import { WorkflowTemplate } from '../../workflows/workflow.types';
import { QwenSceneGraphBuilder, QwenGraphSpec } from '../../scenes/qwen/qwen-scene-graph.builder';
import {
  composeQwenInstruction,
  hasBakedRealcomicStyle,
  stripBakedRealcomicStyle,
  REALCOMIC_TRIGGER,
  REALCOMIC_T2I_STYLE,
} from '../../scenes/qwen/qwen-prompt';
import {
  EngineOptionField,
  ImageEngine,
  ImageEngineCapabilities,
  ImageRenderRequest,
} from '../image-engine';

const WORKFLOW = 'scene_realcomic_qwen_api.json';
const DEFAULT_REALCOMIC_LORA = 'style\\RealComic_2509_base.safetensors';
const SCHEDULERS = ['sgm_uniform', 'simple', 'normal', 'karras', 'beta'];

/**
 * Qwen-Image-Edit-2511 + RealComic — ДЕЙСТВУЮЩИЙ движок картинок, дефолт и
 * рабочая лошадь 19 проектов. Здесь он не переписан, а обёрнут в `ImageEngine`,
 * чтобы у картинок появился тот же шов, что у видео.
 *
 * ⚠️ ГЛАВНОЕ ТРЕБОВАНИЕ к этому файлу: `patch()` обязан давать граф, БАЙТ В БАЙТ
 * совпадающий с тем, что сегодня даёт `QwenRealcomicSceneStrategy.buildPrompt()`.
 * У 19 фильмов якоря утверждены и кадры отрендерены; движок, рисующий «почти
 * так же», обесценил бы их все.
 *
 * Поэтому обёртка НЕ содержит своей копии логики: она делегирует в тот же
 * `QwenSceneGraphBuilder` и тот же `composeQwenInstruction` с теми же
 * аргументами. Идентичность здесь структурная, а не совпадение, которое надо
 * поддерживать руками. Доказывается `scripts/_verify_qwen_engine_parity.ts` —
 * он гоняет стратегию и движок по матрице случаев и сравнивает JSON.
 *
 * Две тонкости, которые легко сломать, «причесав» код:
 *
 * 1. `steps` и `cfg` передаются в билдер ТОЛЬКО когда заданы явно. Билдер
 *    трогает узел лишь при определённом значении, иначе в графе остаётся
 *    значение шаблона. Подставить сюда дефолт (4 и 1.0 — ровно то, что в
 *    шаблоне) сегодня дало бы тот же JSON, но связало бы движок с содержимым
 *    файла: поменяется шаблон — разъедутся молча.
 * 2. Размеры НЕ снапятся. `EmptySD3LatentImage` объявляет step 16, но текущий
 *    путь снапа не делает — его делает `resolveShotRenderSize` выше по стеку.
 *    Ввести снап здесь значит изменить размер части существующих рендеров, то
 *    есть ровно то, чего эта обёртка не должна делать. `snapSize()` объявлен
 *    для вызывающих, которые ВЫБИРАЮТ размер, и внутри `patch()` не вызывается.
 *    У FLUX.2 наоборот — там /16 требование графа, и снап внутри patch есть.
 */
export class Qwen2511ImageEngine implements ImageEngine {
  readonly id = 'qwen2511' as const;
  readonly displayName = 'Qwen-Image-Edit-2511 + RealComic';

  readonly capabilities: ImageEngineCapabilities = {
    maxReferences: 3,
    /** Два канала: семантика на 384px и пиксели на 1024px (`referenceLatents`). */
    identityChannel: 'vl_plus_reference_latent',
    /**
     * Негатив в графе разведён (узел 4), но при cfg 1.0, которого требует
     * Lightning-LoRA, ComfyUI не считает uncond вовсе — то есть он инертен.
     * `false` описывает то, что происходит, а не то, что нарисовано в графе.
     */
    supportsNegative: false,
    promptDialect: 'prose',
    sizeMultiple: 16,
  };

  /** 4 шага при cfg 1.0 — это Lightning; иначе 346 кадров на фильм не окупаются. */
  readonly defaults = { steps: 4, batchSize: 1 };

  readonly optionSchema: EngineOptionField[] = [
    {
      key: 'referenceLatents',
      label: 'Пиксельный канал якоря',
      type: 'boolean',
      default: false,
      hint: 'Включённый канал приносит в кадр не только личность, но и позу, кадрирование '
          + 'и серый фон портрета-якоря. Нужен там, где якорь — единственный носитель стиля.',
    },
    {
      key: 'styleLoraName',
      label: 'Стилевая LoRA',
      type: 'string',
      default: DEFAULT_REALCOMIC_LORA,
    },
    {
      key: 'styleLoraStrength',
      label: 'Сила стилевой LoRA',
      type: 'number',
      default: 1.0,
      min: 0,
      max: 2,
      step: 0.05,
      hint: 'Проверенный A/B-конфиг realcomic_qwen — 0.5.',
    },
    {
      key: 'scheduler',
      label: 'Планировщик',
      type: 'enum',
      default: 'sgm_uniform',
      options: SCHEDULERS,
      hint: 'Рекомендация автора RealComic; на «simple» эта LoRA деградирует.',
    },
    {
      key: 'lightning',
      label: 'Lightning 4-step',
      type: 'boolean',
      default: true,
      hint: 'Выключать только для одиночных hero-картинок: реальные шаги при реальном cfg '
          + 'стоят минуты на кадр, зато оживает негатив.',
    },
  ];

  workflowFor(_participants: number, _visualStyle?: string | null): string {
    // Один граф на 0–3 участников: меняется только число узлов LoadImage,
    // которые достраивает билдер. Так же было и у четырёх регистраций стратегии.
    return WORKFLOW;
  }

  ownsWorkflow(filename: string): boolean {
    return filename === WORKFLOW;
  }

  snapSize(n: number): number {
    // Объявлено для вызывающих, ВЫБИРАЮЩИХ размер. В patch() не применяется —
    // см. пункт 2 в комментарии класса.
    return Math.max(16, Math.floor(n / this.capabilities.sizeMultiple) * this.capabilities.sizeMultiple);
  }

  resolveOptions(raw: unknown): Record<string, unknown> {
    const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

    const scheduler = src.scheduler === undefined || src.scheduler === null
      ? 'sgm_uniform'
      : String(src.scheduler);
    if (!SCHEDULERS.includes(scheduler)) {
      throw new BadRequestException(
        `qwen2511: scheduler должен быть одним из: ${SCHEDULERS.join(', ')} (получено: ${scheduler})`,
      );
    }

    const strength = src.styleLoraStrength === undefined || src.styleLoraStrength === null
      ? 1.0
      : Number(src.styleLoraStrength);
    if (!Number.isFinite(strength) || strength < 0 || strength > 2) {
      throw new BadRequestException(
        `qwen2511: styleLoraStrength должно быть числом 0..2 (получено: ${String(src.styleLoraStrength)})`,
      );
    }

    const out: Record<string, unknown> = {
      referenceLatents: src.referenceLatents === true,
      styleLoraName: src.styleLoraName ? String(src.styleLoraName) : DEFAULT_REALCOMIC_LORA,
      styleLoraStrength: strength,
      scheduler,
      lightning: src.lightning === undefined ? true : src.lightning === true,
    };
    // cfg — только если задан явно; см. пункт 1 в комментарии класса.
    if (src.cfg !== undefined && src.cfg !== null) {
      const cfg = Number(src.cfg);
      if (!Number.isFinite(cfg) || cfg <= 0 || cfg > 30) {
        throw new BadRequestException(`qwen2511: cfg должно быть числом 0..30 (получено: ${String(src.cfg)})`);
      }
      out.cfg = cfg;
    }
    return out;
  }

  /**
   * Собрать инструкцию ровно так, как её собирает действующая стратегия:
   * стилевой блок из позитива вырезается, когда якоря приложены (стиль несёт
   * LoRA плюс триггер), и остаётся, когда кадр рисуется текстом — там текст
   * единственный носитель стиля.
   */
  composeInstruction(req: ImageRenderRequest): string {
    const anchors = this.anchorsOf(req);
    const t2iStyle = hasBakedRealcomicStyle(req.action) ? '' : REALCOMIC_T2I_STYLE;
    const scenePrompt = anchors.length > 0
      ? stripBakedRealcomicStyle(req.action ?? '')
      : (req.action ?? '');

    const objectRef = req.identity.find((p) => p.isObject);

    return composeQwenInstruction({
      participants: req.identity
        .filter((p) => !p.isObject)
        .map((p) => ({ displayName: p.displayName, characterPrompt: p.description })),
      scenePrompt,
      locationPrompt: req.location,
      styleDirective: anchors.length > 0 ? REALCOMIC_TRIGGER : t2iStyle,
      withReferences: anchors.length > 0,
      objectReference: objectRef ? { label: objectRef.displayName } : undefined,
      faceVisibility: req.faceVisibility,
    });
  }

  patch(template: WorkflowTemplate, req: ImageRenderRequest): WorkflowTemplate {
    const opts = this.resolveOptions(req.engineOptions);
    const anchors = this.anchorsOf(req);

    if (anchors.length > this.capabilities.maxReferences) {
      throw new BadRequestException(
        `qwen2511: референсов ${anchors.length}, а граф принимает ${this.capabilities.maxReferences}`,
      );
    }

    const spec: QwenGraphSpec = {
      instruction: this.composeInstruction(req),
      negative: req.negative ?? '',
      width: req.width,
      height: req.height,
      batchSize: req.batchSize ?? 1,
      seed: req.seed,
      steps: req.steps,
      scheduler: opts.scheduler as string,
      filenamePrefix: req.filenamePrefix,
      anchors,
      styleLora: {
        name: opts.styleLoraName as string,
        strengthModel: opts.styleLoraStrength as number,
      },
      referenceLatents: opts.referenceLatents as boolean,
    };
    if (opts.lightning === false) spec.lightning = false;
    if (opts.cfg !== undefined) spec.cfg = opts.cfg as number;

    return new QwenSceneGraphBuilder().build(template, spec);
  }

  /** Якоря в порядке Picture-N: участники, затем предметный референс. */
  private anchorsOf(req: ImageRenderRequest): string[] {
    return req.identity
      .map((p) => p.referencePath)
      .filter((p): p is string => !!p && p.trim().length > 0)
      .slice(0, this.capabilities.maxReferences);
  }
}
