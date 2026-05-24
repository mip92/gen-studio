-- CreateTable
CREATE TABLE "locations" (
    "id"          TEXT NOT NULL,
    "projectId"   TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_projectId_slug_key" ON "locations"("projectId", "slug");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Shot.locationId
ALTER TABLE "shots" ADD COLUMN "locationId" TEXT;

-- CreateIndex
CREATE INDEX "shots_locationId_idx" ON "shots"("locationId");

-- AddForeignKey
ALTER TABLE "shots" ADD CONSTRAINT "shots_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
