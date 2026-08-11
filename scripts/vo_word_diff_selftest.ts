/**
 * Self-test for the VO-validation text pipeline (no test framework in this
 * repo — run manually after touching ru-text-normalize.ts / word-diff.ts):
 *
 *     npx tsx scripts/vo_word_diff_selftest.ts
 *
 * Exits 1 with a ✗ list on any failure.
 */
import { normalizeRuTokens } from '../src/validation/ru-text-normalize';
import { diffWords, classifyDiff } from '../src/validation/word-diff';

let failed = 0;
function check(name: string, cond: boolean, detail?: unknown): void {
  if (cond) { console.log(`  ✓ ${name}`); return; }
  failed++;
  console.error(`  ✗ ${name}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ''}`);
}

console.log('normalizeRuTokens:');
check('ё folding + case', normalizeRuTokens('Её зовут Алёна').join(' ') === 'ее зовут алена');
check('punctuation stripped', normalizeRuTokens('Ну, что — пора?!').join(' ') === 'ну что пора');
check('intra-word hyphen kept', normalizeRuTokens('кто-то во-первых').join(' ') === 'кто-то во-первых');
check('dash dropped', normalizeRuTokens('дом — работа').join(' ') === 'дом работа');
check('simple number words', normalizeRuTokens('двадцать пять лет').join(' ') === '25 лет');
check('compound thousands', normalizeRuTokens('две тысячи двадцать шесть').join(' ') === '2026');
check('bare multiplier', normalizeRuTokens('тысяча человек').join(' ') === '1000 человек');
check('digits canonical', normalizeRuTokens('в 2026-м году').join(' ') === 'в 2026 году');
check('declined number', normalizeRuTokens('сорока тысяч рублей').join(' ') === '40000 рублей');
check('number then word boundary', normalizeRuTokens('пять лет три месяца').join(' ') === '5 лет 3 месяца');

console.log('diffWords + classifyDiff:');
{
  const d = diffWords(normalizeRuTokens('ты приходишь на работу в восемь утра'),
                      normalizeRuTokens('Ты приходишь на работу в восемь утра.'));
  check('identical → pass, wer 0', d.wer === 0 && classifyDiff(d).level === 'pass', d);
}
{
  const d = diffWords(normalizeRuTokens('ты приходишь на работу ровно к началу смены'),
                      normalizeRuTokens('ты приходишь на работу смены'));
  const c = classifyDiff(d);
  check('multi-word gap → fail', d.maxNonNumberGap >= 2 && c.level === 'fail', { d, c });
}
{
  const d = diffWords(normalizeRuTokens('ты снова открываешь дверь'),
                      normalizeRuTokens('ты снова снова открываешь дверь'));
  const c = classifyDiff(d);
  check('stutter → repeatedWords + fail', d.repeatedWords.length === 1 && c.level === 'fail', { d, c });
}
{
  const d = diffWords(normalizeRuTokens('тебе платят сорок тысяч'),
                      normalizeRuTokens('тебе платят 30000'));
  const c = classifyDiff(d);
  check('number mismatch → warn, not fail', d.hasNumberMismatch && c.level === 'warn', { d, c });
}
{
  const d = diffWords(normalizeRuTokens('начальник зовёт тебя в кабинет'),
                      normalizeRuTokens('начальник зовет тебя в кабинед'));
  const c = classifyDiff(d);
  check('isolated garble → warn', d.garbledWords.length === 1 && c.level === 'warn', { d, c });
}
{
  const d = diffWords(normalizeRuTokens('совсем другой текст про завод и цех'),
                      normalizeRuTokens('это вообще иная фраза о фабрике'));
  const c = classifyDiff(d);
  check('total mismatch → fail by WER', d.wer >= 0.35 && c.level === 'fail', { wer: d.wer, level: c.level });
}
{
  const d = diffWords(normalizeRuTokens('ты выходишь из цеха'),
                      normalizeRuTokens('ты выходишь из целого цеха'));
  const c = classifyDiff(d);
  check('single extra word → warn', d.extraWords.length === 1 && c.level === 'warn', { d, c });
}

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
}
console.log('\nall checks passed');
