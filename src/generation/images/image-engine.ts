import { WorkflowTemplate } from '../workflows/workflow.types';

/**
 * Какая модель РИСУЕТ кадры проекта.
 *
 * Ось, которой до сих пор не было. `Project.visualStyle` означал сразу три
 * разные вещи — кто рисует, как выглядит и чем держится личность, — поэтому
 * добавить модель было нельзя, не соврав каждому условию вида
 * `visualStyle === 'realcomic_qwen'`, разбросанному по сервисам. Здесь ось
 * расщеплена ровно так, как она расщеплена у видео (`Project.videoEngine`):
 * движок отвечает за модель, `visualStyle` остаётся отвечать за внешний вид.
 *
 * Выбирается НА ПРОЕКТЕ: один фильм рисуется одной моделью, чтобы в вёрстке
 * книги не соседствовали две фактуры. Ровно та же причина, по которой у видео
 * нет пер-кадрового переопределения.
 */
export type ImageEngineId =
  | 'qwen2511'      // Qwen-Image-Edit-2511 — дефолт, 19 проектов
  | 'flux2_klein'   // FLUX.2 [klein] 9B — мульти-референс через reference_latents
  | 'sdxl_photoreal'
  | 'sdxl_comic'
  | 'flux1_comic';

/**
 * Какой движок подразумевает стиль, когда `Project.imageEngine` не заполнен.
 *
 * NULL в колонке значит «как было», и «как было» определялось стилем — эта
 * функция и есть то самое соответствие, вынутое из неявного вида. Держать
 * синхронно с миграцией `20260826120000_project_image_engine`: расхождение
 * означало бы, что проект после ручной правки колонки начнёт рисоваться иначе,
 * чем рисовался.
 *
 * ⚠️ Соответствие НЕ один-к-одному, и это намеренно. `photoreal_cinematic`
 * рисует окружение Flux'ом (`EnvironmentFluxHires` зарегистрирован первым для
 * нуля участников), а людей SDXL; `graphic_novel_*` на дуэтах уходит в
 * Qwen-оверлей. Поэтому `sdxl_photoreal` — это не «SDXL», а «историческая
 * развилка photoreal», и обязанность будущего легаси-движка — сохранить её
 * внутри себя, а не выпрямить.
 */
export function deriveImageEngineId(visualStyle?: string | null): ImageEngineId {
  switch ((visualStyle ?? '').trim()) {
    case 'realcomic_qwen':            return 'qwen2511';
    case 'graphic_novel_cell_shaded': return 'sdxl_comic';
    case 'graphic_novel_flux':        return 'flux1_comic';
    default:                          return 'sdxl_photoreal';
  }
}

/** Участник кадра — или предмет со своим якорем. */
export interface ImageIdentityRef {
  displayName: string;
  /**
   * `CharacterProfile.promptBase` — состояние персонажа В ЭТОМ КАДРЕ, а не
   * «персонаж вообще». Фингал поставили — дальше кадры идут с фингалом.
   */
  description: string;
  /** Имя файла якоря, уже стажированного в COMFY_INPUT. Абсент = личность из текста. */
  referencePath?: string;
  /** Для движков, которые держат личность обученной LoRA, а не референсом. */
  triggerToken?: string;
  loraPath?: string;
  /**
   * Это ПРЕДМЕТ, а не человек: машина, термос, латунный колокольчик.
   *
   * Признаком, а не разбором строки. Код персонажа-предмета в БД выглядит как
   * `OBJ:<key>`, но подпись, которая уходит в промпт, — человеческая («вишнёвый
   * седан»), и вычислять её из ключа значит её испортить. Подпись берётся из
   * `displayName`.
   *
   * ⚠️ Предметный референс должен идти ПОСЛЕДНИМ в `identity`: в порядке
   * Picture-N его картинка стажируется после якорей участников, и движки
   * раздают номера по порядку массива.
   */
  isObject?: boolean;
  /** Исходная метка участника из БД, если нужна для диагностики. */
  label?: string;
}

/**
 * ОБЩЕЕ ЯДРО входов: это получает ЛЮБОЙ движок картинок.
 *
 * Ничего модель-специфичного здесь быть не должно — именно из-за такой примеси
 * `SceneJobParams` и оброс полями `redux*` и `qwen*`, которые для чужой модели
 * не значат ничего. Всё частное уезжает в `engineOptions`, где живёт под
 * присмотром своего движка (`resolveOptions`), — так же, как у движков TTS
 * эмоции и паузы живут отдельно от общего текста реплики.
 */
export interface ImageRenderRequest {
  /** Что происходит в кадре (`Shot.promptFields.positive`). */
  action: string;
  /** `Location.description` — отдельным входом, чтобы не уезжать в хвост бюджета. */
  location?: string;
  identity: ImageIdentityRef[];
  /** Движок сам знает, инертен у него негатив или нет — см. capabilities. */
  negative?: string;
  /** Из `Shot.shotType`: POV → hands-only, BACK → back. */
  faceVisibility: 'full' | 'back' | 'hands-only';
  width: number;
  height: number;
  /** Форма панели комикса, когда кадр посажен в шаблон страницы. */
  panelShape?: string;
  seed: number;
  steps?: number;
  batchSize?: number;
  filenamePrefix: string;
  /** Уже провалидированные опции движка (результат `resolveOptions`). */
  engineOptions?: Record<string, unknown>;
}

/**
 * Что движок УМЕЕТ. Заменяет разбросанные по коду проверки стиля: гейты и
 * страницы спрашивают возможность, а не имя модели.
 */
export interface ImageEngineCapabilities {
  /** Сколько референсов личности граф принимает за раз. */
  maxReferences: number;
  identityChannel:
    | 'reference_latent'            // FLUX.2: только пиксельный канал
    | 'vl_plus_reference_latent'    // Qwen-2511: семантика 384px + пиксели 1024px
    | 'ip_adapter'
    | 'lora'
    | 'text_only';
  /** false — негатив физически некуда подать (или он инертен при cfg 1.0). */
  supportsNegative: boolean;
  /** Проза для VL/LLM-энкодера против тег-салата для CLIP. */
  promptDialect: 'prose' | 'tags';
  /** Кратность размеров, которую требует граф. */
  sizeMultiple: number;
}

/**
 * Описание одного модель-специфичного поля для UI.
 *
 * Существует затем, чтобы подключение модели не требовало правок фронта:
 * страница настроек рисует поля по дескриптору. У движков TTS поля изолированы
 * правильно, но перечислены условиями в `ProjectTTSSettings.tsx` и константой
 * `TTS_ENGINES` в `lib/api.ts` — то есть новый движок там всё ещё правит фронт.
 * Здесь этой ступеньки нет.
 */
export interface EngineOptionField {
  key: string;
  label: string;
  type: 'boolean' | 'number' | 'string' | 'enum';
  default?: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  hint?: string;
}

/**
 * Семейство моделей картинок за одним швом.
 *
 * Зеркало `VideoEngine`. Сервис рендера владеет жизненным циклом (строки в БД,
 * запись в журнал очереди, стажирование файлов, опрос истории), движок владеет
 * всем модель-специфичным: какой файл графа, какие номера узлов, какой родной
 * размер, на каком диалекте пишется инструкция и какие у него свои поля.
 */
export interface ImageEngine {
  readonly id: ImageEngineId;
  /** Показывается в выпадашке настроек проекта. */
  readonly displayName: string;
  readonly capabilities: ImageEngineCapabilities;
  readonly defaults: { steps: number; batchSize: number };
  readonly optionSchema: EngineOptionField[];

  /**
   * Файл графа для числа участников и стиля. Движок сам владеет своим
   * списком: неизвестное значение сводится к его собственному дефолту, а не
   * бросает исключение, — кадр со устаревшим значением должен рендериться.
   */
  workflowFor(participants: number, visualStyle?: string | null): string;

  /** true, когда этот файл графа умеет патчить именно этот движок. */
  ownsWorkflow(filename: string): boolean;

  /** Подрезать размер под кратность графа. */
  snapSize(n: number): number;

  /** Опции движка: валидация + дефолты. Аналог `resolveEmotionFields()` у TTS. */
  resolveOptions(raw: unknown): Record<string, unknown>;

  /** Собрать инструкцию на диалекте ЭТОЙ модели. */
  composeInstruction(req: ImageRenderRequest): string;

  /** Заполнить шаблон. Аргумент не мутировать. */
  patch(template: WorkflowTemplate, req: ImageRenderRequest): WorkflowTemplate;
}
