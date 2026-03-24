import { LectureStatus, type PrismaClient } from "@prisma/client";

export async function assertChildLessonOutcomeNoDraftReports(
  db: PrismaClient,
  childId: string,
  lessonId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const rows = await db.attendance.findMany({
    where: { childId, lessonId },
    include: { lecture: { select: { status: true } } },
  });

  if (rows.length === 0) {
    return {
      ok: false,
      message: "Cannot mark lesson completed without activity reports for this child and lesson.",
    };
  }

  for (const row of rows) {
    if (row.lecture.status !== LectureStatus.COMPLETED) {
      return {
        ok: false,
        message:
          "Cannot update lesson result while any activity report is still a draft. Complete those reports first.",
      };
    }
  }

  return { ok: true };
}
