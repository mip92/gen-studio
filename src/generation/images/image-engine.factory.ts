import { Injectable, Logger } from '@nestjs/common';
import { ImageEngine, ImageEngineId, deriveImageEngineId } from './image-engine';
import { Flux2KleinImageEngine } from './engines/flux2-klein.engine';
import { Qwen2511ImageEngine } from './engines/qwen2511.engine';

/**
 * Единственное место, где `Project.imageEngine` превращается в реализацию.
 * Зеркало `VideoEngineFactory`.
 *
 * ⚠️ СОСТОЯНИЕ ПЕРЕХОДА, читать перед использованием.
 *
 * Зарегистрированы ДВА движка: Qwen-Image-Edit-2511 (действующий, дефолт
 * де-факто) и FLUX.2 [klein]. Три легаси-пути — `sdxl_photoreal`, `sdxl_comic`,
 * `flux1_comic` — ещё НЕ обёрнуты и по-прежнему обслуживаются `SceneFactory` по
 * паре (`visualStyle`, число участников). В их поведении не изменилось ничего.
 *
 * Поэтому `get()` возвращает `undefined` для незарегистрированного id, а НЕ
 * сводит его к дефолту. Тихий фоллбэк здесь означал бы «нарисуем чем-нибудь» —
 * ровно та лотерея, которую убрали из выбора профиля. Вызывающий, получив
 * `undefined`, обязан идти прежним путём, а не подставлять свою модель.
 *
 * Обёртка Qwen проверена на байт-идентичность действующей стратегии —
 * `scripts/_verify_qwen_engine_parity.ts`, 22 случая. Без этого доказательства
 * её нельзя включать: у 19 фильмов якоря утверждены и кадры отрендерены.
 *
 * Осталось:
 *   3. `capabilities` вместо проверок `visualStyle === …` в четырёх точках;
 *   4. `GET /generation/image-engines` + UI по `optionSchema`;
 *   5. первый тестовый рендер на FLUX.2.
 */
@Injectable()
export class ImageEngineFactory {
  private readonly logger = new Logger(ImageEngineFactory.name);
  private readonly engines = new Map<ImageEngineId, ImageEngine>();

  constructor() {
    this.register(new Qwen2511ImageEngine());
    this.register(new Flux2KleinImageEngine());
  }

  private register(engine: ImageEngine): void {
    this.engines.set(engine.id, engine);
  }

  /** Всё, что реально можно выбрать, — для выпадашки и для дескриптора полей. */
  list(): Array<{
    id: ImageEngineId;
    displayName: string;
    capabilities: ImageEngine['capabilities'];
    optionSchema: ImageEngine['optionSchema'];
  }> {
    return [...this.engines.values()].map((e) => ({
      id: e.id,
      displayName: e.displayName,
      capabilities: e.capabilities,
      optionSchema: e.optionSchema,
    }));
  }

  /** Движок по id, либо undefined — вызывающий сам решает, что делать. */
  get(id?: string | null): ImageEngine | undefined {
    if (!id) return undefined;
    const engine = this.engines.get(id as ImageEngineId);
    if (!engine) {
      this.logger.debug(`imageEngine "${id}" не зарегистрирован — кадр обслуживает SceneFactory`);
    }
    return engine;
  }

  /**
   * Движок проекта: явная колонка, а при пустой колонке — вывод из стиля.
   *
   * `imageEngine IS NULL` значит «как было», и «как было» определялось стилем
   * (`deriveImageEngineId`). Возвращает `undefined`, когда выведенный движок ещё
   * не обёрнут, — тогда кадр обслуживает `SceneFactory`, ровно как до появления
   * этой фабрики.
   */
  forProject(project: { imageEngine?: string | null; visualStyle?: string | null }): ImageEngine | undefined {
    const id = project.imageEngine?.trim() || deriveImageEngineId(project.visualStyle);
    return this.get(id);
  }

  /**
   * Движок, которым был поставлен уже стоящий в очереди рендер — по имени файла
   * графа на его строке. Нужен по той же причине, что и у видео: проект могли
   * переключить после постановки, и патчить надо тем, чем ставили.
   */
  forWorkflow(filename?: string | null): ImageEngine | undefined {
    if (!filename) return undefined;
    for (const engine of this.engines.values()) {
      if (engine.ownsWorkflow(filename)) return engine;
    }
    return undefined;
  }
}
