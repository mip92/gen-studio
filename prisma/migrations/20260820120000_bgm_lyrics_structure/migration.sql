-- BGM: the lyrics channel becomes authorable.
--
-- Until now `lyrics` was the compile-time constant '[instrumental]' on every
-- render (bgm-render.service.ts). ACE-Step 1.5 treats that field as the piece's
-- temporal script, so a 120 s tile was requested with no structure at all.
-- Null keeps the generated arc (built from the caption); a value overrides it.
ALTER TABLE "narrative_blocks" ADD COLUMN "lyricsStructure" TEXT;
ALTER TABLE "music_segments"   ADD COLUMN "lyricsStructure" TEXT;
