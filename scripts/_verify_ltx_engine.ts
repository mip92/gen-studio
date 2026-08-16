/**
 * Прогон `LtxVideoEngine.patch()` по обоим шаблонам БЕЗ GPU.
 *
 * Проверяет ровно то, что нельзя увидеть по типам: что движок попал в те узлы,
 * которые собирался править, что размеры легли кратными 32, что длительность
 * пересчиталась из кадров в СЕКУНДЫ (граф не принимает число кадров), что
 * встроенный расширитель промптов выключен и что `no music` не задвоился.
 *
 *   npx ts-node scripts/_verify_ltx_engine.ts
 */
import { readFileSync } from 'fs';
import * as path from 'path';
import { LtxVideoEngine } from '../src/generation/videos/engines/ltx.engine';

// От cwd, а не от __dirname: скрипт компилируется во временный каталог, и
// путь «на уровень выше от себя» там указывает в пустоту.
const DIR = path.join(process.cwd(), 'data', '_templates', 'comfy');
const engine = new LtxVideoEngine();

let failures = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}: ${JSON.stringify(actual)}${ok ? '' : ` (ждали ${JSON.stringify(expected)})`}`);
};

function run(flow: 'i2v' | 'flf2v', endImage?: string) {
  const file = engine.workflowFor(null, flow);
  console.log(`\n=== ${flow} → ${file}`);
  const template = JSON.parse(readFileSync(path.join(DIR, file), 'utf-8'));
  const wf: any = engine.patch(template, {
    sourceImage: 'first.png',
    endImage,
    motionPrompt: 'he turns the handwheel and the bolts retract, metal grinding inside the door',
    motionNegative: 'blurry, deformed hands',
    seed: 123456,
    width: 640, height: 360,
    length: 121, fps: 24,
    filenamePrefix: 'video/A1_SH01/abc',
  });

  const map = flow === 'flf2v'
    ? { prompt: '252', neg: '217', enh: '250', w: '215', h: '216', dur: '198', fps: '205', seeds: ['196'] }
    : { prompt: '376', neg: '373', enh: '383', w: '372', h: '360', dur: '362', fps: '361', seeds: ['339', '338'] };

  check('первый кадр',        wf['900'].inputs.image, 'first.png');
  if (endImage) check('последний кадр', wf['901'].inputs.image, endImage);
  // 640×360 — реальный размер комикс-панели: кратен 16, но не 64. Движок обязан
  // подрезать, иначе i2v молча уронит половинный латент до другого размера.
  check('ширина (640→снап64)', wf[map.w].inputs.value, 640);
  check('высота (360→снап64)', wf[map.h].inputs.value, 320);
  check('fps',                 wf[map.fps].inputs.value, 24);
  check('длительность, сек',   wf[map.dur].inputs.value, 5);
  check('расширитель выключен', wf[map.enh].inputs.value, false);
  check('негатив',             wf[map.neg].inputs.text, 'blurry, deformed hands');
  for (const s of map.seeds) check(`сид ${s}`, wf[s].inputs.noise_seed, 123456);
  check('имя файла',           wf['902'].inputs.filename_prefix, 'video/A1_SH01/abc');

  const prompt: string = wf[map.prompt].inputs.value;
  check('no music дописан', prompt.endsWith('no music'), true);
  check('no music не задвоен', (prompt.match(/no music/g) || []).length, 1);

  // шаблон не должен быть испорчен — patch обязан работать на копии
  check('шаблон не мутирован', template[map.prompt].inputs.value !== prompt, true);
}

run('i2v');
run('flf2v', 'last.png');

// Идемпотентность `no music`: корпус safecracker уже носит его в промптах.
console.log('\n=== промпт, который УЖЕ содержит no music');
const t = JSON.parse(readFileSync(path.join(DIR, 'video_ltx2_5_flf2v_api.json'), 'utf-8'));
const wf2: any = engine.patch(t, {
  sourceImage: 'a.png', endImage: 'b.png',
  motionPrompt: 'the bolts retract, metal grinding, no music',
  seed: 1, width: 1024, height: 576, length: 121, fps: 24,
  filenamePrefix: 'p',
});
check('no music остался один', (wf2['252'].inputs.value.match(/no music/g) || []).length, 1);

// Камера — общий словарь колонки, включая составные значения.
console.log('\n=== камера');
check('push_in',            engine.cameraClause('push_in'), 'the camera pushes in slowly');
check('arc_left+push_in',   engine.cameraClause('arc_left+push_in'),
      'the camera arcs around him to the left, keeping him centred while pushing in slowly');
check('неизвестное',        engine.cameraClause('teleport'), undefined);

console.log(failures ? `\nПРОВАЛОВ: ${failures}` : '\nвсё сошлось');
process.exit(failures ? 1 : 0);
