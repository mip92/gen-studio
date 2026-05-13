import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '..', '.env'), override: true });

import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

const FRAMING_MAP: Record<string, string> = {
  close_up:           'tight close-up',
  medium:             'medium',
  medium_or_wide:     'medium-wide cinematic',
  wide:               'wide cinematic',
  establishing:       'wide establishing',
};

type LocationClass = 'street' | 'interior' | 'hospital' | 'phone' | 'graphic' | 'black';

interface LocationDef {
  en: string;
  cls: LocationClass;
}

const LOCATION_TRANSLATIONS: Record<string, LocationDef> = {
  'Улица':            { en: 'street',                                cls: 'street' },
  'Двор':             { en: 'courtyard',                             cls: 'street' },
  'Подъезд':          { en: 'apartment building entrance hall',      cls: 'interior' },
  'Лестница':         { en: 'staircase landing',                     cls: 'interior' },
  'Лифт':             { en: 'elevator interior',                     cls: 'interior' },
  'Квартира':         { en: 'apartment interior',                    cls: 'interior' },
  'Кухня':            { en: 'small kitchen interior',                cls: 'interior' },
  'Гостиная':         { en: 'modest living room',                    cls: 'interior' },
  'Спальня':          { en: 'bedroom',                               cls: 'interior' },
  'Ванная':           { en: 'small tiled bathroom',                  cls: 'interior' },
  'Окно':             { en: 'apartment window',                      cls: 'interior' },
  'Балкон':           { en: 'concrete balcony',                      cls: 'street' },
  'Дорога':           { en: 'two-lane road',                         cls: 'street' },
  'Перекрёсток':      { en: 'urban intersection',                    cls: 'street' },
  'Тротуар':          { en: 'sidewalk',                              cls: 'street' },
  'Магазин':          { en: 'small corner store interior',           cls: 'interior' },
  'Кафе':             { en: 'modest neighborhood café',              cls: 'interior' },
  'Офис':             { en: 'small office interior',                 cls: 'interior' },
  'Стройка':          { en: 'construction site',                     cls: 'street' },
  'Гараж':            { en: 'concrete garage block',                 cls: 'street' },
  'Граффити':         { en: 'graffitied concrete wall',              cls: 'street' },
  'Телефон':          { en: 'smartphone screen',                     cls: 'phone' },
  'Город':            { en: 'eastern european city',                 cls: 'street' },
  'Низ кадра':        { en: 'asphalt and feet detail',               cls: 'street' },
  'Чат':              { en: 'phone chat interface',                  cls: 'phone' },
  'Окошко доставки':  { en: 'delivery hatch window',                 cls: 'interior' },
  'Корпорация':       { en: 'corporate office reception',            cls: 'interior' },
  'Аспид':            { en: 'wet asphalt pavement',                  cls: 'street' },
  'Кровь':            { en: 'pavement detail',                       cls: 'street' },
  'Графика':          { en: 'flat editorial infographic',            cls: 'graphic' },
  'Графика/абстракция':{ en: 'abstract typography composition',      cls: 'graphic' },
  'Абстракция':       { en: 'abstract typography composition',       cls: 'graphic' },
  'Город ночь':       { en: 'eastern european city at night',        cls: 'street' },
  'Светофор':         { en: 'urban traffic light at intersection',   cls: 'street' },
  'Асфальт':          { en: 'wet asphalt pavement',                  cls: 'street' },
  'Лужа':             { en: 'rainwater puddle on asphalt',           cls: 'street' },
  'Низкий угол':      { en: 'low-angle pavement perspective',        cls: 'street' },
  'Палата':           { en: 'hospital ward room',                    cls: 'hospital' },
  'Палата окно':      { en: 'hospital ward window',                  cls: 'hospital' },
  'Палата боке':      { en: 'hospital ward seen through soft bokeh', cls: 'hospital' },
  'Коридор':          { en: 'hospital corridor',                     cls: 'hospital' },
  'Кабинет':          { en: 'small office cabinet interior',         cls: 'interior' },
  'Black':            { en: 'pure black frame',                      cls: 'black' },
  'Звук':             { en: 'pure black frame with off-screen sound',cls: 'black' },
  '—':                { en: 'eastern european exterior',             cls: 'street' },
};

// English fallbacks (Studio sometimes stores English labels directly).
const LOCATION_EN_HINTS: Record<string, LocationDef> = {
  'Street':            { en: 'street',                               cls: 'street' },
  'Road':              { en: 'two-lane road',                        cls: 'street' },
  'Crossroads':        { en: 'urban intersection',                   cls: 'street' },
  'Telephone':         { en: 'smartphone screen',                    cls: 'phone' },
  'Phone':             { en: 'smartphone screen',                    cls: 'phone' },
  'Chat':              { en: 'phone chat interface',                 cls: 'phone' },
  'Graphics':          { en: 'flat editorial infographic',           cls: 'graphic' },
  'Graphics/abstraction':{ en: 'abstract typography composition',    cls: 'graphic' },
  'Abstraction':       { en: 'abstract typography composition',      cls: 'graphic' },
  'City':              { en: 'eastern european city',                cls: 'street' },
  'City night':        { en: 'eastern european city at night',       cls: 'street' },
  'Apartment':         { en: 'apartment interior',                   cls: 'interior' },
  'Kitchen':           { en: 'small kitchen interior',                cls: 'interior' },
  'Window':            { en: 'apartment window',                     cls: 'interior' },
  'Balcony':           { en: 'concrete balcony',                     cls: 'street' },
  'Office':            { en: 'small office interior',                cls: 'interior' },
  'Corporate':         { en: 'corporate office reception',           cls: 'interior' },
  'Courtyard':         { en: 'courtyard',                            cls: 'street' },
  'Hallway':           { en: 'apartment building entrance hall',     cls: 'interior' },
  'Asphalt':           { en: 'wet asphalt pavement',                 cls: 'street' },
  'Pavement':          { en: 'pavement detail',                      cls: 'street' },
  'Low frame':         { en: 'low-angle pavement detail',            cls: 'street' },
  'Lower frame':       { en: 'low-angle pavement detail',            cls: 'street' },
  'Construction':      { en: 'construction site',                    cls: 'street' },
};

function translateLocation(label: string | undefined): LocationDef {
  if (!label) return { en: 'eastern european exterior', cls: 'street' };
  const trimmed = label.trim();
  if (LOCATION_TRANSLATIONS[trimmed]) return LOCATION_TRANSLATIONS[trimmed];
  if (LOCATION_EN_HINTS[trimmed])     return LOCATION_EN_HINTS[trimmed];
  // partial match
  for (const [ru, def] of Object.entries(LOCATION_TRANSLATIONS)) {
    if (trimmed.toLowerCase().includes(ru.toLowerCase())) return def;
  }
  for (const [en, def] of Object.entries(LOCATION_EN_HINTS)) {
    if (trimmed.toLowerCase().includes(en.toLowerCase())) return def;
  }
  // Heuristic — non-Latin characters → unknown, fall back to generic.
  return { en: 'eastern european exterior', cls: 'street' };
}

function pickLighting(mood: string | undefined, cls: LocationClass): string {
  // Override by location class first — the studio mood string is generic and
  // covers all three interior+exterior+hospital, so use class to disambiguate.
  if (cls === 'hospital') return 'cold sterile fluorescent ceiling light, soft white walls, clinical atmosphere, faint cyan cast';
  if (cls === 'interior') return 'warm tungsten interior light, soft household lamps, gentle warm highlights, deep ambient shadows';
  if (cls === 'phone')    return 'cool blue screen glow on the user’s fingers, surrounding ambient darkness';
  if (cls === 'graphic')  return '';
  if (cls === 'black')    return '';

  // Street: pick from mood string with sensible defaults.
  if (!mood) return 'cool teal cinematic night light, natural ambience';
  if (/night|cool teal/i.test(mood))      return 'cool teal night light, sodium streetlamp accents, deep shadows';
  if (/dawn|morning/i.test(mood))         return 'soft cold dawn light, pale sky, low contrast';
  if (/overcast|gray|grey/i.test(mood))   return 'overcast gray daylight, flat soft shadows, muted palette';
  if (/tungsten|warm/i.test(mood))        return 'warm tungsten ambient light, soft glow, gentle highlights';
  return mood.split(';')[0].trim();
}

const VOWEL_RE = /^[aeiou]/i;

function articleFor(noun: string): string {
  return VOWEL_RE.test(noun.trim()) ? 'an' : 'a';
}

function cleanAction(text: string): string {
  // Strip leading year markers like "2020:" or "Scene 1:".
  let t = text.replace(/^\s*\d{4}\s*:\s*/, '').replace(/^\s*Scene[^:]*:\s*/i, '').trim();
  // Strip trailing "Location: ..." appended by Studio template.
  t = t.replace(/\.\s*Location:[\s\S]*$/i, '').trim();
  // Strip terminal "No legible logos..." disclaimer.
  t = t.replace(/\.\s*No legible logos[\s\S]*$/i, '').trim();
  // Lowercase first character (action becomes a clause inside larger sentence).
  return t.length > 0 ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}

function buildFluxPrompt(pf: any, shotCode: string): string {
  const framingKey   = FRAMING_MAP[pf?.camera?.framing] ?? 'cinematic';
  const loc          = translateLocation(pf?.location?.label);
  const frameDesc    = (pf?.frameDescription ?? '').trim();
  const beat         = (pf?.narrativeBeat ?? '').trim();
  const lighting     = pickLighting(pf?.lightingMood, loc.cls);

  // Get the English action clause from frameDescription (preferred) or beat.
  const descMatch = frameDesc.match(/^([^.]+)\./);
  const actionRaw = descMatch ? descMatch[1] : (beat || 'cinematic moment');
  const action    = cleanAction(actionRaw);

  // GRAPHIC class — flat editorial illustration, no realistic anchor / lens.
  if (loc.cls === 'graphic') {
    const lead    = `A clean flat editorial ${loc.en === 'flat editorial infographic' ? 'infographic' : 'typographic composition'}`;
    const subject = action || 'minimal abstract concept';
    const palette = 'muted documentary palette, deep teal and warm tungsten accents, period-correct 2020s eastern european editorial style';
    const styleG  = 'vector-flat illustration, soft paper texture, sharp typography in latin script, balanced negative space, no readable brand logos, no watermarks';
    return [`${lead} — ${subject}`, palette, styleG].join('. ').replace(/\s+/g, ' ').trim();
  }

  // PHONE class — extreme close-up of a screen; photoreal but tight.
  if (loc.cls === 'phone') {
    const lead    = `An extreme close-up of a ${loc.en} held in a hand`;
    const ui      = action || 'app interface visible';
    const palette = 'cool blue screen glow on the user’s fingers, surrounding ambient darkness, shallow depth of field, fingerprints on glass';
    const camera  = 'shot on 50mm macro lens, crisp focus on the display, subtle film grain';
    const styleP  = 'photorealistic cinematic documentary, screen content sharp and legible';
    return [`${lead} — ${ui}`, palette, camera, styleP].join('. ').replace(/\s+/g, ' ').trim();
  }

  // BLACK FRAME class — minimal transition frame.
  if (loc.cls === 'black') {
    const subj = action || 'silent transition';
    return `A pure black cinematic frame, deep total darkness with the faintest hint of texture, used as a narrative cut — ${subj}. minimal grain, no visible elements, no text, no watermarks`;
  }

  // STREET / INTERIOR / HOSPITAL — full shot template.
  const interiorExt = loc.cls === 'street' ? 'exterior' : 'interior';
  let environmentAnchor: string;
  if (loc.cls === 'street') {
    environmentAnchor = 'set in a generic post-soviet eastern european microdistrict, distant weathered concrete panel apartment blocks visible, residential neighborhood context, period 2020s, no readable signage';
  } else if (loc.cls === 'hospital') {
    environmentAnchor = 'modest post-soviet eastern european hospital interior, sterile pale green and beige walls, basic worn medical equipment, period 2020s, fluorescent ceiling lights, no readable signage';
  } else if (/office|cabinet|reception|corporate/i.test(loc.en)) {
    environmentAnchor = 'small post-soviet eastern european office interior, plain desk, neutral walls, basic office equipment, period 2020s, no readable signage or branding';
  } else {
    environmentAnchor = 'cramped post-soviet eastern european apartment interior, period 2020s, lived-in details, modest furnishings, mismatched textiles, no readable signage';
  }
  const camera = 'shot on 35mm anamorphic lens, sharp focus, deep depth of field, subtle 16mm film grain, naturalistic handheld feel';
  const style  = 'photorealistic cinematic documentary, emotional storytelling, no text or watermarks';

  // Article based on the FIRST word of the sentence (the framing modifier).
  const firstWord = framingKey.split(/\s+/)[0];
  const article   = articleFor(firstWord);

  const parts = [
    `${capitalize(article)} ${framingKey} ${interiorExt} shot of ${articleFor(loc.en)} ${loc.en} — ${action}`,
    environmentAnchor,
    lighting,
    camera,
    style,
  ].filter((s) => s && s.trim().length > 0);

  return parts.join('. ').replace(/\s+/g, ' ').replace(/\s*—\s*/g, ' — ').trim();
}

function capitalize(s: string): string {
  return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const previewIdx = process.argv.indexOf('--preview');
  const limit  = previewIdx >= 0
    ? (Number(process.argv[previewIdx + 1]) || 3)
    : undefined;

  const shots = await prisma.shot.findMany({
    where: {
      project: { slug: 'night_courier' },
      participants: { none: { characterId: { not: null } } },
    },
    select: { id: true, shotCode: true, promptFields: true },
    orderBy: { shotCode: 'asc' },
    take: limit,
  });

  console.log(`Found ${shots.length} env shots${dryRun ? ' (DRY RUN)' : ''}`);

  let updated = 0;
  for (const shot of shots) {
    const pf = shot.promptFields as Record<string, unknown> | null;
    if (!pf) continue;

    const oldPositive = pf.positive as string | undefined;
    if (!oldPositive) continue;

    if (pf.positiveSdxl && !dryRun) {
      console.log(`  skip ${shot.shotCode} (already migrated)`);
      continue;
    }

    const newPositive = buildFluxPrompt(pf, shot.shotCode);

    if (dryRun) {
      console.log(`\n=== ${shot.shotCode} ===`);
      console.log(`OLD: ${oldPositive.substring(0, 200)}...`);
      console.log(`NEW: ${newPositive}`);
      continue;
    }

    const next = {
      ...pf,
      positiveSdxl: oldPositive,
      positive:     newPositive,
    };

    await prisma.shot.update({
      where: { id: shot.id },
      data:  { promptFields: next },
    });

    console.log(`  ${shot.shotCode}: ${newPositive.substring(0, 100)}...`);
    updated++;
  }

  if (!dryRun) console.log(`\nUpdated ${updated} shots`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
