import { LessonNivo } from "./constants";

export type Lesson = {
  id: string;
  title: string;
  nivo: LessonNivo;
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
