import { LessonNivo } from "../lessons/constants";

export type ActivityLecture = {
  id: string;
  topic: string;
  nivo?: LessonNivo | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  attendance: Array<{
    lectureId: string;
    childId: string;
    lessonId?: string | null;
    present: boolean;
    homeworkDone?: boolean | null;
    comment?: string | null;
    child: {
      id: string;
      firstName: string;
      lastName: string;
      nivo: LessonNivo;
      status: string;
    };
    lesson?: {
      id: string;
      title: string;
      nivo: LessonNivo;
    } | null;
  }>;
};

export type ActivitiesListResponse = {
  items: ActivityLecture[];
  total: number;
  page: number;
  pageSize: number;
};
