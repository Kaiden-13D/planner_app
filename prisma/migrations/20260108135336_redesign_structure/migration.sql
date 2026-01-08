/*
  Warnings:

  - You are about to drop the column `targetDate` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `assignmentId` on the `QuestionLog` table. All the data in the column will be lost.
  - You are about to drop the column `lectureId` on the `QuestionLog` table. All the data in the column will be lost.
  - You are about to drop the column `refType` on the `QuestionLog` table. All the data in the column will be lost.
  - You are about to drop the column `slideNum` on the `QuestionLog` table. All the data in the column will be lost.
  - You are about to drop the `Assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Book` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lecture` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Subtask` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endDate` to the `Goal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Goal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuestionLog" DROP CONSTRAINT "QuestionLog_assignmentId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionLog" DROP CONSTRAINT "QuestionLog_lectureId_fkey";

-- DropForeignKey
ALTER TABLE "Subtask" DROP CONSTRAINT "Subtask_assignmentId_fkey";

-- DropIndex
DROP INDEX "QuestionLog_assignmentId_idx";

-- DropIndex
DROP INDEX "QuestionLog_lectureId_idx";

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "targetDate",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "QuestionLog" DROP COLUMN "assignmentId",
DROP COLUMN "lectureId",
DROP COLUMN "refType",
DROP COLUMN "slideNum",
ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "textbookId" TEXT;

-- DropTable
DROP TABLE "Assignment";

-- DropTable
DROP TABLE "Book";

-- DropTable
DROP TABLE "Lecture";

-- DropTable
DROP TABLE "Subtask";

-- DropEnum
DROP TYPE "RefType";

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Textbook" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Textbook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTask" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "courseId" TEXT,
    "textbookId" TEXT,
    "content" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyTask_date_idx" ON "DailyTask"("date");

-- CreateIndex
CREATE INDEX "DailyTask_courseId_idx" ON "DailyTask"("courseId");

-- CreateIndex
CREATE INDEX "DailyTask_textbookId_idx" ON "DailyTask"("textbookId");

-- CreateIndex
CREATE INDEX "Goal_periodType_idx" ON "Goal"("periodType");

-- CreateIndex
CREATE INDEX "Goal_startDate_endDate_idx" ON "Goal"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "QuestionLog_courseId_idx" ON "QuestionLog"("courseId");

-- CreateIndex
CREATE INDEX "QuestionLog_textbookId_idx" ON "QuestionLog"("textbookId");

-- AddForeignKey
ALTER TABLE "DailyTask" ADD CONSTRAINT "DailyTask_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTask" ADD CONSTRAINT "DailyTask_textbookId_fkey" FOREIGN KEY ("textbookId") REFERENCES "Textbook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
