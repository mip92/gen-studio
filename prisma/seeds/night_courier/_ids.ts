/**
 * Fixed UUIDs for all Night Courier entities.
 * Hardcoded so IDs are stable across re-seeds and can be
 * referenced from the file-system asset structure.
 */
export const IDS = {
  project: '85308827-719a-453e-9a3f-29363ea4637c',

  characters: {
    HERO:     '65f71cc9-da89-46df-89bf-be3857afef48',
    FATHER:   '27f44d77-e600-4017-a663-99de99c9d8b8',
    MOTHER:   'c4e16ab3-2fa7-40ff-a721-0824e0f12a9c',
    DOCTOR:   'd4205717-0864-4122-ba95-34d1d564c7b9',
    FRIENDS:  '058f5ac2-b32a-4dfe-9642-b33a98b19b46',
    CLIENT:   '57d86762-614a-4a8d-88f9-c36203d28e12',
    COURIERS: '7f45b581-108f-479d-a14b-9b4dc494cc0c',
  },

  profiles: {
    HERO_TEEN_15:      '571fd066-2634-4e7c-ac8c-6a62064fff52',
    HERO_OVERLOAD_16:  '225e5f1c-5e6e-4e19-9541-3b0e84c5df73',
    HERO_RECOVERY_17:  'c31e629c-1422-4f5b-a275-269e337bd9e0',
    FATHER_BASE:       'd07f08a8-8cad-4ecb-affd-77199beb00d5',
    MOTHER_BASE:       'd307ada9-d7cf-4f98-b3f3-3c4ae49b753e',
    DOCTOR_BASE:       '03f8a4b5-1d9e-4cda-a046-869a4967d45b',
    FRIENDS_BASE:      '4fe5c3ae-571d-4ac2-844f-3bb4fa1eb026',
    CLIENT_BASE:       'da5c64ea-a6d3-4a17-b080-db0bb90cd545',
    COURIERS_BASE:     '5a807ac9-0d41-4d3e-a82d-dc71561cdc97',
  },
} as const;

/** Map profileCode → characterCode for folder creation */
export const PROFILE_TO_CHARACTER: Record<string, keyof typeof IDS.characters> = {
  HERO_TEEN_15:     'HERO',
  HERO_OVERLOAD_16: 'HERO',
  HERO_RECOVERY_17: 'HERO',
  FATHER_BASE:      'FATHER',
  MOTHER_BASE:      'MOTHER',
  DOCTOR_BASE:      'DOCTOR',
  FRIENDS_BASE:     'FRIENDS',
  CLIENT_BASE:      'CLIENT',
  COURIERS_BASE:    'COURIERS',
};
