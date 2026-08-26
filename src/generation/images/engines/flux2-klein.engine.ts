import { BadRequestException } from '@nestjs/common';
import { WorkflowTemplate } from '../../workflows/workflow.types';
import {
  EngineOptionField,
  ImageEngine,
  ImageEngineCapabilities,
  ImageRenderRequest,
} from '../image-engine';

const WORKFLOW = 'scene_flux2_klein_api.json';

/**
 * Номера узлов, на которые смотрит `patch()`. Держать синхронно с
 * `scripts/_verify_flux2_template.py` — там те же константы объявлены как
 * спецификация, и проверяльщик валидирует по ним расширение цепочки.
 */
const N = {
  unet:     '1',
  clip:     '10',
  vae:      '11',
  positive: '3',
  latent:   '5',
  sched:    '16',
  sampler:  '17',
  noise:    '18',
  guider:   '19',
  save:     '8',
} as const;

const EXPECTED_CLASS: Record<string, string> = {
  [N.unet]:     'UNETLoader',
  [N.clip]:     'CLIPLoader',
  [N.vae]:      'VAELoader',
  [N.positive]: 'CLIPTextEncode',
  [N.latent]:   'EmptyFlux2LatentImage',
  [N.sched]:    'Flux2Scheduler',
  [N.sampler]:  'KSamplerSelect',
  [N.noise]:    'RandomNoise',
  [N.guider]:   'BasicGuider',
  [N.save]:     'SaveImage',
};

/** Цепочка референсов: LoadImage 21.. → VAEEncode 24.. → ReferenceLatent 27.. */
const REF_LOAD_BASE = 21;
const REF_ENC_BASE  = 24;
const REF_SET_BASE  = 27;

const MAX_REFERENCES = 3;

const SAMPLERS = ['euler', 'euler_ancestral', 'heun', 'dpmpp_2m', 'ddim'];

/**
 * FLUX.2 [klein] 9B — второй движок картинок рядом с Qwen-Image-Edit-2511.
 *
 * Qwen НЕ заменяется и остаётся дефолтом: это добавление, как LTX был
 * добавлением к Wan.
 *
 * Всё ниже подтверждено замером по файлам этой сборки, а не взято из статьи:
 *
 * - текстовый энкодер — Qwen3-8B (`CLIPLoader type=flux2`). У klein
 *   `txt_in.weight = [4096, 12288]`, а klein_te делает трёхслойный тап, значит
 *   контекст равен 3 × hidden: 3 × 4096 = 12288. С Qwen3-4B вышло бы 7680 и
 *   граф бы не сошёлся. Оба файла лежат на диске, так что ошибиться легко;
 * - `guidance`-эмбеда в модели НЕТ (ключей `guidance_in` в файле нет), поэтому
 *   ни `FluxGuidance`, ни `CFGGuider` здесь не нужны и негатив подать некуда —
 *   отсюда `supportsNegative: false`. Ровно как у Qwen при cfg 1.0, только по
 *   другой причине: там негатив есть, но инертен, тут его нет вовсе;
 * - латент 128-канальный с шагом /16 (`img_in.weight = [4096, 128]`,
 *   `EmptyFlux2LatentImage` объявляет step 16) — отсюда `sizeMultiple: 16`;
 * - личность приезжает через `reference_latents` (`model_base.py:2201`:
 *   «Flux2 VAE image latent -> additive second conditioning»), узлом
 *   `ReferenceLatent`, сцепляемым по одному латенту за раз.
 *
 * ⚠️ ГЛАВНОЕ ОТЛИЧИЕ ОТ QWEN, и его надо знать до того, как переводить фильм.
 * У Qwen два канала: семантический (картинка уезжает в промпт как
 * `Picture N: <|vision_start|>`) и пиксельный. Поэтому Qwen можно СКАЗАТЬ, кто
 * на каком референсе: «Picture 1 is Иван». У FLUX.2 текстового якоря для
 * референса нет вообще — `ReferenceLatent` добавляет латент к обусловливанию и
 * молчит о том, чей он. Следствия:
 *
 *   1. на одиночных кадрах это не мешает — референс один, путать не с чем;
 *   2. на дуэтах модель не знает, какой латент кому принадлежит, и различать
 *      участников приходится прозой. Это надо проверить на первых рендерах, а
 *      не считать решённым;
 *   3. подпись `Picture N is …` в инструкцию писать НЕЛЬЗЯ — для этой модели
 *      это просто мусорные слова в тексте.
 */
export class Flux2KleinImageEngine implements ImageEngine {
  readonly id = 'flux2_klein' as const;
  readonly displayName = 'FLUX.2 [klein] (мульти-референс)';

  readonly capabilities: ImageEngineCapabilities = {
    maxReferences: MAX_REFERENCES,
    identityChannel: 'reference_latent',
    supportsNegative: false,
    promptDialect: 'prose',
    sizeMultiple: 16,
  };

  /**
   * 20 шагов — дефолт самого `Flux2Scheduler`. Klein дистиллирован ПО
   * GUIDANCE (один проход модели на шаг вместо двух), а не по числу шагов, так
   * что четырёхшаговой схемы, как у Qwen с Lightning-LoRA, здесь нет. Число
   * подлежит замеру на первых рендерах — оставлять как есть без проверки
   * нечестно, а выдумывать меньше без замера тем более.
   */
  readonly defaults = { steps: 20, batchSize: 1 };

  readonly optionSchema: EngineOptionField[] = [
    {
      key: 'steps',
      label: 'Шагов сэмплера',
      type: 'number',
      default: 20,
      min: 1,
      max: 60,
      step: 1,
      hint: 'Дефолт планировщика — 20. Klein дистиллирован по guidance, не по шагам.',
    },
    {
      key: 'sampler',
      label: 'Сэмплер',
      type: 'enum',
      default: 'euler',
      options: SAMPLERS,
    },
    {
      key: 'kvCache',
      label: 'KV-кэш для референсов',
      type: 'boolean',
      default: false,
      hint: 'FluxKVCache: кэширует ключи референсных картинок между шагами. '
          + 'Узел объявлен экспериментальным — по умолчанию выключен.',
    },
  ];

  workflowFor(_participants: number, _visualStyle?: string | null): string {
    // Один граф на все числа участников: количество референсов меняет не файл,
    // а длину цепочки ReferenceLatent, которую достраивает patch().
    return WORKFLOW;
  }

  ownsWorkflow(filename: string): boolean {
    return filename === WORKFLOW;
  }

  snapSize(n: number): number {
    return Math.max(16, Math.floor(n / this.capabilities.sizeMultiple) * this.capabilities.sizeMultiple);
  }

  resolveOptions(raw: unknown): Record<string, unknown> {
    const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

    const steps = this.int(src.steps, this.defaults.steps, 1, 60, 'steps');
    const sampler = src.sampler === undefined || src.sampler === null
      ? 'euler'
      : String(src.sampler);
    if (!SAMPLERS.includes(sampler)) {
      throw new BadRequestException(
        `flux2_klein: sampler должен быть одним из: ${SAMPLERS.join(', ')} (получено: ${sampler})`,
      );
    }
    return { steps, sampler, kvCache: src.kvCache === true };
  }

  private int(v: unknown, dflt: number, min: number, max: number, name: string): number {
    if (v === undefined || v === null || v === '') return dflt;
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) {
      throw new BadRequestException(
        `flux2_klein: ${name} должно быть целым в диапазоне ${min}..${max} (получено: ${String(v)})`,
      );
    }
    return n;
  }

  /**
   * Инструкция на диалекте FLUX.2: проза, описывающая ГОТОВУЮ картинку.
   *
   * Порядок как у Qwen (действие → место), потому что правило общее для
   * обеих моделей: описывай результат, а не правку. Разница в двух вещах —
   * нет строк `Picture N is …` (см. комментарий класса) и нет keep-клаузы про
   * лицо и волосы: у FLUX.2 нет канала, к которому её можно было бы адресовать,
   * а на кадре без лица она у Qwen как раз и приводила к приказу нарисовать
   * лицо там, где его нет.
   *
   * Бюджет слов здесь НЕ режется. У Qwen обрезка своя и выстраданная
   * (`QWEN_WORD_BUDGET`), но её порог измерен под другой энкодер; переносить
   * число на Qwen3-8B без замера — это выдумать константу. До первых рендеров
   * инструкция уходит целиком.
   */
  composeInstruction(req: ImageRenderRequest): string {
    const parts: string[] = [];

    for (const p of req.identity) {
      if (!p.description?.trim()) continue;
      parts.push(`${p.displayName} is ${p.description.trim()}.`);
    }

    if (req.action?.trim()) parts.push(req.action.trim().replace(/\.?$/, '.'));
    if (req.location?.trim()) parts.push(req.location.trim().replace(/\.?$/, '.'));

    if (req.faceVisibility === 'hands-only') {
      parts.push('Only the hands are in frame; no face is visible.');
    } else if (req.faceVisibility === 'back') {
      parts.push('Seen from behind; the face is not visible.');
    }

    return parts.join(' ');
  }

  patch(template: WorkflowTemplate, req: ImageRenderRequest): WorkflowTemplate {
    const wf = structuredClone(template) as Record<string, any>;

    for (const [id, cls] of Object.entries(EXPECTED_CLASS)) {
      if (wf[id]?.class_type !== cls) {
        throw new Error(
          `flux2_klein: узел "${id}" должен быть ${cls}, а найдено `
          + `"${wf[id]?.class_type ?? 'ничего'}" — шаблон перенумерован. `
          + `Сверь scene_flux2_klein_api.json и константы N в flux2-klein.engine.ts, `
          + `затем прогони scripts/_verify_flux2_template.py`,
        );
      }
    }

    const set = (id: string, key: string, value: unknown) => { wf[id].inputs[key] = value; };
    const opts = this.resolveOptions(req.engineOptions);

    const width  = this.snapSize(req.width);
    const height = this.snapSize(req.height);
    const steps  = req.steps ?? (opts.steps as number);

    set(N.positive, 'text', this.composeInstruction(req));

    set(N.latent, 'width', width);
    set(N.latent, 'height', height);
    set(N.latent, 'batch_size', req.batchSize ?? this.defaults.batchSize);

    // Планировщик считает расписание сигм по ДЛИНЕ последовательности, то есть
    // по тем же самым размерам. Рассинхрон с латентом не падает — он тихо
    // портит шумоподавление, поэтому размеры проставляются из одной переменной.
    set(N.sched, 'steps', steps);
    set(N.sched, 'width', width);
    set(N.sched, 'height', height);

    set(N.sampler, 'sampler_name', opts.sampler);
    set(N.noise, 'noise_seed', req.seed);
    set(N.save, 'filename_prefix', req.filenamePrefix);

    // ── личность: цепочка референсов ────────────────────────────────────────
    const refs = req.identity
      .map((p) => p.referencePath)
      .filter((p): p is string => !!p && p.trim().length > 0);

    if (refs.length > MAX_REFERENCES) {
      throw new BadRequestException(
        `flux2_klein: референсов ${refs.length}, а граф принимает ${MAX_REFERENCES}`,
      );
    }

    let conditioning: [string, number] = [N.positive, 0];
    refs.forEach((name, i) => {
      const loadId = String(REF_LOAD_BASE + i);
      const encId  = String(REF_ENC_BASE + i);
      const setId  = String(REF_SET_BASE + i);
      wf[loadId] = { class_type: 'LoadImage', inputs: { image: name } };
      wf[encId]  = { class_type: 'VAEEncode', inputs: { pixels: [loadId, 0], vae: [N.vae, 0] } };
      wf[setId]  = { class_type: 'ReferenceLatent', inputs: { conditioning, latent: [encId, 0] } };
      conditioning = [setId, 0];
    });
    set(N.guider, 'conditioning', conditioning);

    // ── необязательный KV-кэш ───────────────────────────────────────────────
    if (opts.kvCache === true && refs.length > 0) {
      const kvId = '30';
      wf[kvId] = { class_type: 'FluxKVCache', inputs: { model: [N.unet, 0] } };
      set(N.guider, 'model', [kvId, 0]);
    }

    return wf as WorkflowTemplate;
  }
}
