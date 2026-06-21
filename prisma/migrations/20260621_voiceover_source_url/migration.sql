-- Optional provenance link for a library voiceover — the YouTube (or any) URL
-- the reference clip was lifted from, so the source can be re-found later.
-- Nullable: legacy rows and direct uploads have no link until one is added.

ALTER TABLE "voiceovers" ADD COLUMN "sourceUrl" TEXT;
