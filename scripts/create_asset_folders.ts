/**
 * Creates the reference-image folder structure for all character profiles.
 * Run once: npx tsx scripts/create_asset_folders.ts
 *
 * Structure:
 *   gen-studio/projects/<projectId>/characters/<characterId>/<profileId>/reference.jpg
 */
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { IDS, PROFILE_TO_CHARACTER } from '../prisma/seeds/night_courier/_ids';

const APP_ROOT = join(__dirname, '..');

for (const [profileCode, profileId] of Object.entries(IDS.profiles)) {
  const charCode = PROFILE_TO_CHARACTER[profileCode];
  const charId   = IDS.characters[charCode];

  const dir = join(APP_ROOT, 'projects', IDS.project, 'characters', charId, profileId);
  mkdirSync(dir, { recursive: true });

  const placeholder = join(dir, 'reference.jpg');
  if (!existsSync(placeholder)) {
    writeFileSync(placeholder, '');
    console.log(`created  ${placeholder.replace(APP_ROOT, '.')}`);
  } else {
    console.log(`exists   ${placeholder.replace(APP_ROOT, '.')}`);
  }
}
