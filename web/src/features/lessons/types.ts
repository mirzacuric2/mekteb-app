import { LessonNivo, LessonProgram } from "./constants";

export type Lesson = {
  id: string;
  title: string;
  program: LessonProgram;
  nivo: LessonNivo | 0;
  createdAt: string;
  updatedAt: string;
};

export type NivoBook = {
  nivo: LessonNivo;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
};
