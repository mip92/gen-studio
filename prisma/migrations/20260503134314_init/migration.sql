-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_profiles" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "profileCode" TEXT NOT NULL,
    "ageLabel" TEXT,
    "targetImages" INTEGER,
    "promptBase" TEXT NOT NULL,
    "negative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reference_assets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "profileCode" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reference_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sceneKey" TEXT NOT NULL,
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "defaultReferenceProfileCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shots" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "shotCode" TEXT NOT NULL,
    "promptFields" JSONB,
    "workflowRouteKey" TEXT,
    "referenceProfileId" TEXT,
    "referenceImagePool" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shot_participants" (
    "id" TEXT NOT NULL,
    "shotId" TEXT NOT NULL,
    "characterId" TEXT,
    "label" TEXT NOT NULL,

    CONSTRAINT "shot_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_templates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_routes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_route_steps" (
    "id" TEXT NOT NULL,
    "workflowRouteId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "workflowTemplateId" TEXT NOT NULL,

    CONSTRAINT "workflow_route_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "characters_projectId_code_key" ON "characters"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "character_profiles_characterId_profileCode_key" ON "character_profiles"("characterId", "profileCode");

-- CreateIndex
CREATE INDEX "reference_assets_projectId_profileCode_idx" ON "reference_assets"("projectId", "profileCode");

-- CreateIndex
CREATE UNIQUE INDEX "scenes_projectId_sceneKey_key" ON "scenes"("projectId", "sceneKey");

-- CreateIndex
CREATE INDEX "shots_projectId_sceneId_idx" ON "shots"("projectId", "sceneId");

-- CreateIndex
CREATE UNIQUE INDEX "shots_projectId_shotCode_key" ON "shots"("projectId", "shotCode");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_templates_projectId_templateKey_key" ON "workflow_templates"("projectId", "templateKey");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_routes_projectId_routeKey_key" ON "workflow_routes"("projectId", "routeKey");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_route_steps_workflowRouteId_stepOrder_key" ON "workflow_route_steps"("workflowRouteId", "stepOrder");

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_profiles" ADD CONSTRAINT "character_profiles_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_assets" ADD CONSTRAINT "reference_assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shots" ADD CONSTRAINT "shots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shots" ADD CONSTRAINT "shots_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shot_participants" ADD CONSTRAINT "shot_participants_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "shots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shot_participants" ADD CONSTRAINT "shot_participants_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_routes" ADD CONSTRAINT "workflow_routes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_route_steps" ADD CONSTRAINT "workflow_route_steps_workflowRouteId_fkey" FOREIGN KEY ("workflowRouteId") REFERENCES "workflow_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_route_steps" ADD CONSTRAINT "workflow_route_steps_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "workflow_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
