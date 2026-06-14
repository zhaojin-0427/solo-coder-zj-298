-- CreateTable
CREATE TABLE "Lending" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jewelryId" INTEGER NOT NULL,
    "borrowerName" TEXT NOT NULL,
    "borrowerContact" TEXT NOT NULL,
    "lendDate" DATETIME NOT NULL,
    "expectedReturnDate" DATETIME NOT NULL,
    "purpose" TEXT NOT NULL,
    "deposit" REAL NOT NULL DEFAULT 0,
    "conditionBeforeLend" TEXT NOT NULL,
    "returnCondition" TEXT,
    "hasWear" BOOLEAN NOT NULL DEFAULT false,
    "compensationAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT '借出中',
    "actualReturnDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lending_jewelryId_fkey" FOREIGN KEY ("jewelryId") REFERENCES "Jewelry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
