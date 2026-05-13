import { type Tx, readJson } from './_shared';
import { IDS } from './_ids';

interface ProfileDef {
  profileId:      string;
  ageLabel:       string;
  targetImages:   number;
  promptBase:     string;
  negative:       string;
  promptAngles?:  string;
  promptVariety?: string;
}

interface CharacterDef {
  characterId: string;
  displayName: string;
  profiles:    ProfileDef[];
}

interface CharacterStructure {
  characters: CharacterDef[];
}

export async function seedCharacters(tx: Tx, projectId: string): Promise<void> {
  const { characters } = readJson<CharacterStructure>(
    'character_pipeline/character_structure.json',
  );

  for (const char of characters) {
    const charId = IDS.characters[char.characterId as keyof typeof IDS.characters];
    if (!charId) throw new Error(`No hardcoded ID for character: ${char.characterId}`);

    await tx.character.create({
      data: {
        id:          charId,
        projectId,
        code:        char.characterId,
        displayName: char.displayName,
        profiles: {
          create: char.profiles.map((p) => {
            const profileId = IDS.profiles[p.profileId as keyof typeof IDS.profiles];
            if (!profileId) throw new Error(`No hardcoded ID for profile: ${p.profileId}`);
            return {
              id:            profileId,
              profileCode:   p.profileId,
              ageLabel:      p.ageLabel,
              targetImages:  p.targetImages,
              promptBase:    p.promptBase,
              negative:      p.negative,
              promptAngles:  p.promptAngles  ?? null,
              promptVariety: p.promptVariety ?? null,
            };
          }),
        },
      },
    });
  }

  console.log(`  ✓ characters  ${characters.length}`);
}
