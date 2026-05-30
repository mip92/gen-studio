-- IndexTTS-2 second-engine support. Silero stays as the default for legacy
-- projects (ttsEngine NULL = treat as 'silero'); per-project switch flips to
-- 'indextts2' once a voice reference is uploaded.

ALTER TABLE "projects"
  ADD COLUMN "ttsEngine"       TEXT,
  ADD COLUMN "ttsVoiceRefPath" TEXT;

-- Per-job engine + emotion knobs. All nullable: silero rows leave the new
-- columns NULL, indextts2 rows leave `voice` populated with a placeholder
-- (service writes 'indextts2' for traceability but the field is ignored at
-- inference time).
ALTER TABLE "tts_jobs"
  ADD COLUMN "engine"           TEXT,
  ADD COLUMN "emotionPreset"    TEXT,
  ADD COLUMN "emotionIntensity" DOUBLE PRECISION,
  ADD COLUMN "emotionRefName"   TEXT;

-- Per-project library of named emotion-reference clips. ON DELETE CASCADE
-- so dropping a project sweeps its refs along with everything else.
CREATE TABLE "project_tts_emotion_refs" (
  "id"        TEXT       NOT NULL,
  "projectId" TEXT       NOT NULL,
  "name"      TEXT       NOT NULL,
  "filePath"  TEXT       NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "project_tts_emotion_refs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_tts_emotion_refs_projectId_name_key"
  ON "project_tts_emotion_refs"("projectId", "name");

ALTER TABLE "project_tts_emotion_refs"
  ADD CONSTRAINT "project_tts_emotion_refs_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
