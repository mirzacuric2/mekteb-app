import type { Role } from "../../../types";

export type HelpHandbookSection = {
  id: string;
  title: string;
  bullets: string[];
};

export type HelpHandbookContent = {
  documentTitle: string;
  intro: string;
  sections: HelpHandbookSection[];
};

export type HandbookLocaleRegistry = Partial<Record<Role, HelpHandbookContent>>;
