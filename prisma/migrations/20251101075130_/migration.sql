/*
  Warnings:

  - You are about to drop the column `firstMessageAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[conversationId,seq]` on the table `Message` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Conversation_sessionId_updatedAt_idx";

-- DropIndex
DROP INDEX "public"."Conversation_status_idx";

-- DropIndex
DROP INDEX "public"."User_email_key";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "firstMessageAt",
DROP COLUMN "lastMessageAt",
DROP COLUMN "sessionId",
DROP COLUMN "status",
DROP COLUMN "summary",
DROP COLUMN "title";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "passwordHash",
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_seq_key" ON "Message"("conversationId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
