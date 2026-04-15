-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('C', 'UC', 'R', 'SR', 'SSR', 'UR', 'MR');

-- CreateEnum
CREATE TYPE "BattleMode" AS ENUM ('TRAINING', 'CASUAL', 'RANKED', 'RAID');

-- CreateEnum
CREATE TYPE "ResetCycle" AS ENUM ('DAILY', 'WEEKLY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isGuest" BOOLEAN NOT NULL DEFAULT true,
    "guestToken" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT,
    "avatarUrl" TEXT,
    "coins" INTEGER NOT NULL DEFAULT 100,
    "rating" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUid" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wikiPageId" INTEGER NOT NULL,
    "wikiTitle" TEXT NOT NULL,
    "wikiSlug" TEXT NOT NULL,
    "wikiExtract" TEXT NOT NULL,
    "wikiThumbUrl" TEXT,
    "wikiQualityScore" INTEGER NOT NULL DEFAULT 0,
    "attack" INTEGER NOT NULL,
    "health" INTEGER NOT NULL,
    "speed" INTEGER NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "categories" TEXT[],
    "tags" TEXT[],

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFoil" BOOLEAN NOT NULL DEFAULT false,
    "isForSale" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackState" (
    "userId" TEXT NOT NULL,
    "storedPacks" INTEGER NOT NULL DEFAULT 0,
    "nextPackAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PackState_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GhostTeam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cardIds" TEXT[],
    "cp" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "GhostTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" "BattleMode" NOT NULL,
    "userId" TEXT NOT NULL,
    "defenderGhostId" TEXT,
    "winnerId" TEXT,
    "combatLog" JSONB NOT NULL,
    "cpAttacker" INTEGER NOT NULL,
    "cpDefender" INTEGER NOT NULL DEFAULT 0,
    "coinsEarned" INTEGER NOT NULL DEFAULT 0,
    "ratingDelta" INTEGER,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketListing" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sellerId" TEXT NOT NULL,
    "userCardId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "soldAt" TIMESTAMP(3),
    "buyerId" TEXT,

    CONSTRAINT "MarketListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coinReward" INTEGER NOT NULL,
    "packReward" INTEGER NOT NULL DEFAULT 0,
    "resetCycle" "ResetCycle" NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "goal" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "periodStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "packReward" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_guestToken_key" ON "User"("guestToken");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "OAuthAccount_provider_providerUid_key" ON "OAuthAccount"("provider", "providerUid");
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");
CREATE UNIQUE INDEX "Card_wikiPageId_key" ON "Card"("wikiPageId");
CREATE INDEX "UserCard_userId_idx" ON "UserCard"("userId");
CREATE INDEX "UserCard_cardId_idx" ON "UserCard"("cardId");
CREATE UNIQUE INDEX "GhostTeam_userId_key" ON "GhostTeam"("userId");
CREATE INDEX "Battle_userId_idx" ON "Battle"("userId");
CREATE UNIQUE INDEX "MarketListing_userCardId_key" ON "MarketListing"("userCardId");
CREATE INDEX "MarketListing_sellerId_idx" ON "MarketListing"("sellerId");
CREATE INDEX "MarketListing_soldAt_idx" ON "MarketListing"("soldAt");
CREATE UNIQUE INDEX "Quest_slug_key" ON "Quest"("slug");
CREATE UNIQUE INDEX "UserQuest_userId_questId_periodStart_key" ON "UserQuest"("userId", "questId", "periodStart");
CREATE INDEX "UserQuest_userId_idx" ON "UserQuest"("userId");
CREATE UNIQUE INDEX "Achievement_slug_key" ON "Achievement"("slug");
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- AddForeignKey
ALTER TABLE "OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PackState" ADD CONSTRAINT "PackState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GhostTeam" ADD CONSTRAINT "GhostTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketListing" ADD CONSTRAINT "MarketListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MarketListing" ADD CONSTRAINT "MarketListing_userCardId_fkey" FOREIGN KEY ("userCardId") REFERENCES "UserCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserQuest" ADD CONSTRAINT "UserQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
