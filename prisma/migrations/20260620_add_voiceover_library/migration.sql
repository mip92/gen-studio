-- Shared, reusable voiceover library (закадровая озвучка). One voice-clone clip
-- is stored ONCE under data/_voices/<slug>/ and assigned to many projects via
-- projects.ttsVoiceoverId, instead of copying voice_reference.* into every
-- project's data/<slug>/tts/. `checksum` (md5) is unique so identical uploads
-- collapse to one row. Assigning a voiceover mirrors its shared path into
-- projects.ttsVoiceRefPath, which the render/gating code already reads.

CREATE TABLE "voiceovers" (
  "id"        TEXT         NOT NULL,
  "slug"      TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "filePath"  TEXT         NOT NULL,
  "ext"       TEXT         NOT NULL,
  "bytes"     INTEGER      NOT NULL,
  "checksum"  TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "voiceovers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "voiceovers_slug_key"     ON "voiceovers"("slug");
CREATE UNIQUE INDEX "voiceovers_checksum_key" ON "voiceovers"("checksum");

ALTER TABLE "projects" ADD COLUMN "ttsVoiceoverId" TEXT;

CREATE INDEX "projects_ttsVoiceoverId_idx" ON "projects"("ttsVoiceoverId");

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_ttsVoiceoverId_fkey"
  FOREIGN KEY ("ttsVoiceoverId") REFERENCES "voiceovers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
