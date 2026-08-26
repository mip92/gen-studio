/**
 * Прогон `Flux2KleinImageEngine.patch()` по шаблону БЕЗ GPU.
 *
 * `_verify_flux2_template.py` доказывает, что граф законен с точки зрения
 * ComfyUI (классы, входы, комбо, имена файлов моделей). Этот скрипт доказывает
 * второе, чего типы не видят: что движок попал ИМЕННО в те узлы и собрал ИМЕННО
 * ту цепочку референсов, которую проверяльщик благословил. Расхождение между
 * питоновской спецификацией и TS-реализацией — это и есть класс ошибки, из-за
 * которой такой скрипт вообще нужен.
 *
 *   npx ts-node scripts/_verify_flux2_engine.ts
 */
import { readFileSync } from 'fs';
import * as path from 'path';
import { Flux2KleinImageEngine } from '../src/generation/images/engines/flux2-klein.engine';
import { ImageRenderRequest } from '../src/generation/images/image-engine';

// От cwd, а не от __dirname: ts-node компилирует во временный каталог.
const DIR = path.join(process.cwd(), 'data', '_templates', 'comfy');
const engine = new Flux2KleinImageEngine();

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}: ${JSON.stringify(actual)}`
    + `${ok ? '' : ` (ждали ${JSON.stringify(expected)})`}`);
};

const base = (over: Partial<ImageRenderRequest> = {}): ImageRenderRequest => ({
  action: 'a medium shot at eye level, Павел half-turned from the counter, weight on his back foot, '
        + 'sliding a tray of loaves onto the rack, warm oven light from the right',
  location: 'a cramped back-room bakery, flour dust in the air, tiled walls',
  identity: [],
  faceVisibility: 'full',
  width: 1344,
  height: 768,
  seed: 424242,
  filenamePrefix: 'scene/A1_SH01/abc',
  ...over,
});

function load() {
  return JSON.parse(readFileSync(path.join(DIR, engine.workflowFor(0)), 'utf-8'));
}

// ── 1. без референсов ───────────────────────────────────────────────────────
console.log('\n=== без референсов (кадр-окружение)');
{
  const wf: any = engine.patch(load(), base());
  check('узлов', Object.keys(wf).length, 12);
  check('guider.conditioning смотрит в текст', wf['19'].inputs.conditioning, ['3', 0]);
  check('seed', wf['18'].inputs.noise_seed, 424242);
  check('шагов по дефолту планировщика', wf['16'].inputs.steps, 20);
  check('sampler', wf['17'].inputs.sampler_name, 'euler');
  check('префикс', wf['8'].inputs.filename_prefix, 'scene/A1_SH01/abc');
  check('размеры латента', [wf['5'].inputs.width, wf['5'].inputs.height], [1344, 768]);
  check('размеры планировщика совпадают с латентом',
    [wf['16'].inputs.width, wf['16'].inputs.height],
    [wf['5'].inputs.width, wf['5'].inputs.height]);
  const text: string = wf['3'].inputs.text;
  check('в инструкции нет «Picture N» (у FLUX.2 нет текстового якоря референса)',
    /Picture \d/.test(text), false);
  check('в инструкции нет keep-клаузы про лицо', /Keep each person/i.test(text), false);
}

// ── 2. цепочка референсов ───────────────────────────────────────────────────
for (const n of [1, 2, 3]) {
  console.log(`\n=== ${n} референс(ов)`);
  const identity = Array.from({ length: n }, (_, i) => ({
    displayName: `Герой${i + 1}`,
    description: `a man of forty, short grey stubble, worn denim jacket`,
    referencePath: `anchor${i + 1}.png`,
  }));
  const wf: any = engine.patch(load(), base({ identity }));

  check('узлов', Object.keys(wf).length, 12 + n * 3);
  for (let i = 0; i < n; i++) {
    const load_ = String(21 + i);
    const enc = String(24 + i);
    const set = String(27 + i);
    check(`[${load_}] LoadImage`, [wf[load_].class_type, wf[load_].inputs.image],
      ['LoadImage', `anchor${i + 1}.png`]);
    check(`[${enc}] VAEEncode ← ${load_}, vae 11`,
      [wf[enc].class_type, wf[enc].inputs.pixels, wf[enc].inputs.vae],
      ['VAEEncode', [load_, 0], ['11', 0]]);
    const expectedPrev = i === 0 ? ['3', 0] : [String(27 + i - 1), 0];
    check(`[${set}] ReferenceLatent сцеплен с предыдущим`,
      [wf[set].class_type, wf[set].inputs.conditioning, wf[set].inputs.latent],
      ['ReferenceLatent', expectedPrev, [enc, 0]]);
  }
  check('guider берёт ХВОСТ цепочки', wf['19'].inputs.conditioning, [String(27 + n - 1), 0]);
  check('имена участников попали в инструкцию',
    (wf['3'].inputs.text as string).includes('Герой1 is'), true);
}

// ── 3. снап размеров под кратность 16 ───────────────────────────────────────
console.log('\n=== размеры кратны 16');
{
  const wf: any = engine.patch(load(), base({ width: 1337, height: 777 }));
  check('1337 → 1328', wf['5'].inputs.width, 1328);
  check('777 → 768', wf['5'].inputs.height, 768);
  check('планировщик снапнут так же',
    [wf['16'].inputs.width, wf['16'].inputs.height], [1328, 768]);
}

// ── 4. негатив некуда подать ────────────────────────────────────────────────
console.log('\n=== негатив');
{
  const wf: any = engine.patch(load(), base({ negative: 'blurry, deformed hands, anime' }));
  const classes = Object.values(wf).map((n: any) => n.class_type);
  check('движок объявляет, что негатива нет', engine.capabilities.supportsNegative, false);
  check('в графе нет CFGGuider', classes.includes('CFGGuider'), false);
  check('в графе нет FluxGuidance', classes.includes('FluxGuidance'), false);
  check('негатив нигде не оказался',
    JSON.stringify(wf).includes('deformed hands'), false);
}

// ── 5. KV-кэш ───────────────────────────────────────────────────────────────
console.log('\n=== KV-кэш (опция движка)');
{
  const identity = [{ displayName: 'Герой', description: 'a man of forty', referencePath: 'a.png' }];
  const on: any = engine.patch(load(), base({ identity, engineOptions: { kvCache: true } }));
  check('узел FluxKVCache появился', on['30']?.class_type, 'FluxKVCache');
  check('guider.model идёт через кэш', on['19'].inputs.model, ['30', 0]);
  const off: any = engine.patch(load(), base({ identity }));
  check('по умолчанию кэша нет', off['30'], undefined);
  check('guider.model идёт напрямую из UNETLoader', off['19'].inputs.model, ['1', 0]);
}

// ── 6. валидация опций и защита от перенумерации ────────────────────────────
console.log('\n=== отказы');
{
  const threw = (fn: () => unknown): string | null => {
    try { fn(); return null; } catch (e: any) { return String(e?.message ?? e); }
  };
  check('дурной sampler отвергнут',
    !!threw(() => engine.resolveOptions({ sampler: 'нет-такого' })), true);
  check('steps вне диапазона отвергнут',
    !!threw(() => engine.resolveOptions({ steps: 999 })), true);
  check('steps по умолчанию', engine.resolveOptions({}).steps, 20);
  check('четвёртый референс отвергнут',
    !!threw(() => engine.patch(load(), base({
      identity: Array.from({ length: 4 }, (_, i) => ({
        displayName: `Г${i}`, description: 'x', referencePath: `a${i}.png`,
      })),
    }))), true);

  const renumbered = load();
  renumbered['16'].class_type = 'SomethingElse';
  const msg = threw(() => engine.patch(renumbered, base()));
  check('перенумерованный шаблон падает с внятным сообщением',
    !!msg && msg.includes('Flux2Scheduler'), true);
}

console.log(failures ? `\nПРОВАЛ: ${failures} проверок` : '\nВСЁ ЧИСТО');
process.exit(failures ? 1 : 0);
