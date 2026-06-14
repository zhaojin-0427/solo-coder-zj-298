-- AlterTable
ALTER TABLE "Jewelry" ADD COLUMN "invoiceNumber" TEXT;
ALTER TABLE "Jewelry" ADD COLUMN "purchasePrice" REAL;

-- CreateTable
CREATE TABLE "Valuation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jewelryId" INTEGER NOT NULL,
    "currentValue" REAL NOT NULL,
    "valuationDate" DATETIME NOT NULL,
    "valuationAgency" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Valuation_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "Jewelry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Insurance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jewelryId" INTEGER NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "insuranceCompany" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "insuredAmount" REAL NOT NULL,
    "deductible" REAL NOT NULL DEFAULT 0,
    "claimsContact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '生效中',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Insurance_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "Jewelry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jewelryId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "credentialNumber" TEXT,
    "description" TEXT,
    "fileUrl" TEXT,
    "issueDate" DATETIME,
    "issuedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Credential_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "Jewelry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
