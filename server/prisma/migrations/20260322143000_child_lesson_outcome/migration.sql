-- CreateTable
CREATE TABLE "ChildLessonOutcome" (
    "childId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "passed" BOOLEAN,
    "mark" INTEGER,
    "markedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChildLessonOutcome_pkey" PRIMARY KEY ("childId","lessonId")
);

-- CreateIndex
CREATE INDEX "ChildLessonOutcome_lessonId_idx" ON "ChildLessonOutcome"("lessonId");

-- CreateIndex
CREATE INDEX "ChildLessonOutcome_childId_idx" ON "ChildLessonOutcome"("childId");

-- AddForeignKey
ALTER TABLE "ChildLessonOutcome" ADD CONSTRAINT "ChildLessonOutcome_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLessonOutcome" ADD CONSTRAINT "ChildLessonOutcome_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildLessonOutcome" ADD CONSTRAINT "ChildLessonOutcome_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
