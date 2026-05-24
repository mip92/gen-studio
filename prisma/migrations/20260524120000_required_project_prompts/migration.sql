-- Mark project-level prompt content fields as required. All existing projects
-- already have values for these fields (seeded before this migration), so the
-- NOT NULL conversion is safe. New projects must supply them via the create
-- DTO — see CreateProjectDto in src/projects/dto/.

ALTER TABLE "projects"
  ALTER COLUMN "defaultNegative"            SET NOT NULL,
  ALTER COLUMN "defaultVideoNegative"       SET NOT NULL,
  ALTER COLUMN "defaultMotionPrompt"        SET NOT NULL,
  ALTER COLUMN "defaultStaticMotionPrompt"  SET NOT NULL;

-- Empty strings are not the same as NULL — but they defeat the constraint's
-- intent (an empty prompt is functionally missing). Add CHECK constraints
-- so the DB enforces non-empty too.
ALTER TABLE "projects"
  ADD CONSTRAINT "projects_defaultNegative_not_empty"
    CHECK (length(trim("defaultNegative")) > 0),
  ADD CONSTRAINT "projects_defaultVideoNegative_not_empty"
    CHECK (length(trim("defaultVideoNegative")) > 0),
  ADD CONSTRAINT "projects_defaultMotionPrompt_not_empty"
    CHECK (length(trim("defaultMotionPrompt")) > 0),
  ADD CONSTRAINT "projects_defaultStaticMotionPrompt_not_empty"
    CHECK (length(trim("defaultStaticMotionPrompt")) > 0);
