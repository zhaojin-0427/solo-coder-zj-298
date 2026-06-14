-- CreateTable
CREATE TABLE "WearPlan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "planDate" DATETIME NOT NULL,
    "scenario" TEXT NOT NULL,
    "outfitTags" TEXT NOT NULL,
    "candidateJewelryIds" TEXT NOT NULL,
    "selectedJewelryIds" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "forbiddenConditions" TEXT,
    "status" TEXT NOT NULL DEFAULT '待确认',
    "confirmedAt" DATETIME,
    "conflictResolved" BOOLEAN NOT NULL DEFAULT false,
    "recommendationSnapshot" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WearPlanItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wearPlanId" INTEGER NOT NULL,
    "jewelryId" INTEGER NOT NULL,
    "recommendationScore" INTEGER NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "riskLevelText" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "unavailableReasons" TEXT,
    "isAvailable" BOOLEAN NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "factors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WearPlanItem_wearPlanId_fkey" FOREIGN KEY ("wearPlanId") REFERENCES "WearPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WearPlanItem_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "Jewelry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WearPlanItem_wearPlanId_jewelryId_key" ON "WearPlanItem"("wearPlanId", "jewelryId");
