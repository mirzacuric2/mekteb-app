import { LessonNivo, LessonProgram } from "../lessons/constants";
import { LECTURE_STATUS } from "./reporting.constants";

export type LectureStatus = (typeof LECTURE_STATUS)[keyof typeof LECTURE_STATUS];

export type ActivityLecture = {
  id: string;
  topic: string;
  program: LessonProgram;
  nivo?: LessonNivo | null;
  note?: string | null;
  status: LectureStatus;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  community?: { id: string; name: string } | null;
  attendance: Array<{
    lectureId: string;
    childId: string;
    lessonId?: string | null;
    lessonText?: string | null;
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
      nivo: LessonNivo | 0;
      program: LessonProgram;
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
  id: string;
  lectureId: string;
  childId: string;
  lessonId: string;
  title: string;
  description?: string | null;
  done: boolean;
  updatedAt: string;
  lecture: {
    id: string;
    topic: string;
    status: LectureStatus;
    completedAt?: string | null;
    updatedAt: string;
    createdAt: string;
    community?: { id: string; name: string } | null;
  };
  child: {
    id: string;
    firstName: string;
    lastName: string;
    nivo: LessonNivo;
  };
  lesson: {
    id: string;
    title: string;
    nivo: LessonNivo | 0;
    program: LessonProgram;
  };
};

export type HomeworkQueueListResponse = {
  items: HomeworkQueueItem[];
  total: number;
  page: number;
  pageSize: number;
};
