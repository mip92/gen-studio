/**
 * Доказательство, что `Qwen2511ImageEngine` даёт БАЙТ В БАЙТ тот же граф, что
 * действующая `QwenRealcomicSceneStrategy`.
 *
 * Это единственное, что делает обёртку безопасной. У 19 фильмов якоря утверждены
 * и кадры отрендерены; движок, рисующий «почти так же», обесценил бы их все.
 * Поэтому здесь не проверка отдельных полей, а сравнение JSON целиком по матрице
 * случаев: число участников, наличие якорей, запечённый стилевой блок,
 * видимость лица, предметный референс, пиксельный канал, своя стилевая LoRA,
 * заданные и незаданные шаги.
 *
 *   npx ts-node scripts/_verify_qwen_engine_parity.ts
 */
import { readFileSync } from 'fs';
import * as path from 'path';
import { QwenRealcomicSceneStrategy } from '../src/generation/scenes/strategies/qwen-realcomic-scene.strategy';
import { SceneJobParams } from '../src/generation/scenes/scene-job.types';
import { Qwen2511ImageEngine } from '../src/generation/images/engines/qwen2511.engine';
import { ImageRenderRequest } from '../src/generation/images/image-engine';

const DIR = path.join(process.cwd(), 'data', '_templates', 'comfy');
const engine = new Qwen2511ImageEngine();

const BAKED_STYLE =
  'graphic novel illustration, clean confident ink linework, muted cinematic color palette, ';

let failures = 0;

/**
 * Перевод SceneJobParams → ImageRenderRequest. ЭТО и есть контракт адаптера:
 * если сюда приходится дописывать что-то хитрое, значит общее ядро входов
 * протекает и надо править контракт, а не тест.
 */
function toRequest(p: SceneJobParams): ImageRenderRequest {
  const anchors = p.anchorImagePaths ?? [];
  const people = (p.participants ?? []).map((sp, i) => ({
    displayName: sp.displayName,
    description: sp.characterPrompt,
    referencePath: anchors[i],
    triggerToken: sp.triggerToken,
    loraPath: sp.loraPath,
  }));
  // Предметный референс лежит ПОСЛЕДНИМ в anchorImagePaths и потому последним
  // в identity — порядок Picture-N.
  const identity = p.objectReferenceLabel
    ? [...people, {
        displayName: p.objectReferenceLabel,
        description: '',
        referencePath: anchors[people.length],
        isObject: true,
      }]
    : people;

  return {
    action: p.scenePrompt,
    location: p.locationPrompt,
    identity,
    negative: p.negativeExtra,
    faceVisibility: p.faceVisibility ?? 'full',
    width: p.width,
    height: p.height,
    panelShape: p.panelShape,
    seed: p.seed,
    steps: p.steps,
    batchSize: p.batchSize,
    filenamePrefix: p.filenamePrefix,
    engineOptions: {
      referenceLatents: p.qwenReferenceLatents ?? false,
      ...(p.qwenStyleLora
        ? { styleLoraName: p.qwenStyleLora.name, styleLoraStrength: p.qwenStyleLora.strengthModel ?? 1.0 }
        : {}),
    },
  };
}

function participants(n: number) {
  const names = ['Павел', 'Ната', 'Кузьмич'];
  return Array.from({ length: n }, (_, i) => ({
    triggerToken: `tok${i}`,
    displayName: names[i],
    loraPath: `C:/loras/p${i}.safetensors`,
    characterPrompt: `a man of forty-${i}, short grey stubble, worn denim jacket`,
  }));
}

function compare(label: string, params: SceneJobParams) {
  const strategy = new QwenRealcomicSceneStrategy(
    (params.participants?.length ?? 0) as 0 | 1 | 2 | 3,
  );
  const template = JSON.parse(readFileSync(path.join(DIR, strategy.filename), 'utf-8'));
  const fromStrategy = strategy.buildPrompt(JSON.parse(JSON.stringify(template)), params);
  const fromEngine = engine.patch(JSON.parse(JSON.stringify(template)), toRequest(params));

  const a = JSON.stringify(fromStrategy, Object.keys(fromStrategy).sort());
  const b = JSON.stringify(fromEngine, Object.keys(fromEngine).sort());
  const ok = JSON.stringify(fromStrategy) === JSON.stringify(fromEngine) || a === b;

  if (ok) {
    console.log(`  ok   ${label}`);
    return;
  }
  failures++;
  console.log(`  FAIL ${label}`);
  const keys = new Set([...Object.keys(fromStrategy), ...Object.keys(fromEngine)]);
  for (const k of [...keys].sort((x, y) => Number(x) - Number(y))) {
    const l = JSON.stringify((fromStrategy as any)[k]);
    const r = JSON.stringify((fromEngine as any)[k]);
    if (l !== r) {
      console.log(`         узел ${k}:`);
      console.log(`           стратегия: ${l}`);
      console.log(`           движок   : ${r}`);
    }
  }
}

const base = (over: Partial<SceneJobParams> = {}): SceneJobParams => ({
  participants: [],
  scenePrompt: 'a medium shot at eye level, Павел half-turned from the counter, weight on his '
    + 'back foot, sliding a tray of loaves onto the rack, warm oven light from the right',
  locationPrompt: 'a cramped back-room bakery, flour dust in the air, tiled walls',
  width: 1344,
  height: 768,
  seed: 424242,
  filenamePrefix: 'scene/A1_SH01/abc',
  ...over,
});

console.log('\n=== число участников × якоря');
for (const n of [0, 1, 2, 3]) {
  compare(`${n} участник(ов), без якорей (текстовый путь)`, base({ participants: participants(n) }));
  if (n > 0) {
    compare(`${n} участник(ов), якоря приложены`, base({
      participants: participants(n),
      anchorImagePaths: Array.from({ length: n }, (_, i) => `anchor${i + 1}.png`),
    }));
  }
}

console.log('\n=== запечённый стилевой блок в позитиве');
compare('запечён + якоря (блок должен быть вырезан)', base({
  participants: participants(1),
  anchorImagePaths: ['anchor1.png'],
  scenePrompt: BAKED_STYLE + 'Павел upright at the oven door, sliding a tray in',
}));
compare('запечён, без якорей (блок остаётся — текст единственный носитель стиля)', base({
  participants: participants(1),
  scenePrompt: BAKED_STYLE + 'Павел upright at the oven door, sliding a tray in',
}));

console.log('\n=== видимость лица');
for (const fv of ['full', 'back', 'hands-only'] as const) {
  compare(`faceVisibility=${fv}`, base({
    participants: participants(1),
    anchorImagePaths: ['anchor1.png'],
    faceVisibility: fv,
  }));
}

console.log('\n=== предметный референс');
compare('участник + предмет последним', base({
  participants: participants(1),
  anchorImagePaths: ['anchor1.png', 'obj_tray.png'],
  objectReferenceLabel: 'the dented steel tray',
}));
compare('два участника + предмет', base({
  participants: participants(2),
  anchorImagePaths: ['a1.png', 'a2.png', 'obj_tray.png'],
  objectReferenceLabel: 'the dented steel tray',
}));

console.log('\n=== опции движка');
compare('пиксельный канал включён', base({
  participants: participants(1),
  anchorImagePaths: ['anchor1.png'],
  qwenReferenceLatents: true,
}));
compare('своя стилевая LoRA с силой 0.5', base({
  participants: participants(1),
  anchorImagePaths: ['anchor1.png'],
  qwenStyleLora: { name: 'style\\Other.safetensors', strengthModel: 0.5 },
}));
compare('своя стилевая LoRA без силы (билдер подставит 1.0)', base({
  participants: participants(1),
  anchorImagePaths: ['anchor1.png'],
  qwenStyleLora: { name: 'style\\Other.safetensors' },
}));

console.log('\n=== шаги, батч, негатив');
compare('шаги заданы', base({ participants: participants(1), anchorImagePaths: ['a.png'], steps: 8 }));
compare('шаги НЕ заданы (остаётся значение шаблона)', base({
  participants: participants(1), anchorImagePaths: ['a.png'],
}));
compare('батч 4', base({ participants: participants(1), anchorImagePaths: ['a.png'], batchSize: 4 }));
compare('негатив задан', base({
  participants: participants(1), anchorImagePaths: ['a.png'],
  negativeExtra: 'blurry, deformed hands, extra fingers',
}));

console.log(failures ? `\nПРОВАЛ: расхождений ${failures}` : '\nВСЁ ЧИСТО — графы совпадают байт в байт');
process.exit(failures ? 1 : 0);
