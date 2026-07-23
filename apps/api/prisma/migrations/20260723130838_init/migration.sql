-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "lastCdxFetch" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "timestamp" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "frameUrl" TEXT,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Domain_hostname_key" ON "Domain"("hostname");

-- CreateIndex
CREATE INDEX "Snapshot_domainId_idx" ON "Snapshot"("domainId");

-- CreateIndex
CREATE UNIQUE INDEX "Snapshot_domainId_timestamp_key" ON "Snapshot"("domainId", "timestamp");

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
