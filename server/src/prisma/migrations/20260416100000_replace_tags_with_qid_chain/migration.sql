-- Replace categories and tags columns with a single qidChain JSON column

ALTER TABLE "Card" DROP COLUMN IF EXISTS "categories";
ALTER TABLE "Card" DROP COLUMN IF EXISTS "tags";
ALTER TABLE "Card" ADD COLUMN "qidChain" JSONB NOT NULL DEFAULT '[]';
