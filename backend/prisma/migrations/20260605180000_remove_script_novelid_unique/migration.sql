-- Script.novelId: remove unique, allow multiple scripts per novel
DROP INDEX IF EXISTS "Script_novelId_key";
CREATE INDEX IF NOT EXISTS "Script_novelId_idx" ON "Script"("novelId");
