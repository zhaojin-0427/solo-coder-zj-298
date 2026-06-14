-- CreateTable
CREATE TABLE "Jewelry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "storageLocation" TEXT NOT NULL,
    "suitableScenarios" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Outfit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jewelryId" INTEGER NOT NULL,
    "wearDate" DATETIME NOT NULL,
    "outfitTags" TEXT NOT NULL,
    "isAllergic" BOOLEAN NOT NULL DEFAULT false,
    "isFading" BOOLEAN NOT NULL DEFAULT false,
    "cleanStatus" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Outfit_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "Jewelry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jewelryId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Maintenance_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "Jewelry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Repair" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jewelryId" INTEGER NOT NULL,
    "problemType" TEXT NOT NULL,
    "sendDate" DATETIME NOT NULL,
    "repairItems" TEXT NOT NULL,
    "cost" REAL NOT NULL,
    "returnDate" DATETIME,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Repair_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "Jewelry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
