import { LessonNivo } from "../lessons/constants";
import { LECTURE_STATUS } from "./reporting.constants";

export type LectureStatus = (typeof LECTURE_STATUS)[keyof typeof LECTURE_STATUS];

export type ActivityLecture = {
  id: string;
  topic: string;
  nivo?: LessonNivo | null;
  note?: string | null;
  status: LectureStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  attendance: Array<{
    lectureId: string;
    childId: string;
    lessonId?: string | null;
    present: boolean;
    homeworkDone?: boolean | null;
    homeworkTitle?: string | null;
    homeworkDescription?: string | null;
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

export type HomeworkQueueItem = {
  childId: string;
  lessonId: string;
  title: string;
  description?: string | null;
  done: boolean;
  updatedAt: string;
  child: {
    id: string;
    firstName: string;
    lastName: string;
    nivo: LessonNivo;
  };
  lesson: {
    id: string;
    title: string;
    nivo: LessonNivo;
  };
};

export type HomeworkQueueListResponse = {
  items: HomeworkQueueItem[];
  total: number;
  page: number;
  pageSize: number;
};
