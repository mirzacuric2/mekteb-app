import type { HelpHandbookContent } from "../../types";

export const superAdminHandbookSv: HelpHandbookContent = {
  documentTitle: "Handbok för superadministratör",
  intro:
    "Du arbetar över föreningar: användare, föreningar, lektionskatalog och rapportering med flerföreningssammanhang. Denna handbok visas endast för SUPER_ADMIN-konton.",
  sections: [
    {
      id: "nav",
      title: "Så fungerar navigeringen",
      bullets: [
        "Sidomeny: samma som administratörer plus Lektioner under Hantering.",
        "Föreningar: öppna listan på /app/communities, sedan detaljrutt /app/communities/:id för vald förening.",
        "Överst: Rapportera aktiviteter med bredare datainsyn än en enföreningsadmin.",
      ],
    },
    {
      id: "dashboard",
      title: "Instrumentpanel",
      bullets: [
        "Landning: senaste inlägg och navigation vidare.",
        "KPI-kort för framsteg och veckoförhandsgranskning av händelser visas inte för SUPER_ADMIN i nuvarande app—använd Barn, Aktiviteter och Föreningsdetalj för operativ insyn.",
      ],
    },
    {
      id: "posts",
      title: "Inlägg",
      bullets: [
        "Läs och moderera som administratör. Att skapa inlägg kan vara begränsat till community-ADMIN i API—använd patch/radering och moderering där det tillåts, eller samarbeta med en förenings-ADMIN vid nya inlägg om POST är begränsad.",
      ],
    },
    {
      id: "users",
      title: "Användare",
      bullets: [
        "Alla föreningar (sök, filter, sidindelning enligt implementation).",
        "Skapa användare som ADMIN, BOARD_MEMBER eller PARENT; flytta användare mellan föreningar; full redigering/radering inom policy.",
      ],
    },
    {
      id: "children",
      title: "Barn",
      bullets: [
        "Överblick över föreningar när det behövs; förening väljs vid skapa/uppdatera där det finns.",
        "Minimera exponering av känsliga fält (personnummer) enligt styrningsregler.",
      ],
    },
    {
      id: "activities",
      title: "Aktiviteter",
      bullets: [
        "Samma Rapporter och Läxkö som ADMIN, med flerföreningssammanhang.",
        "Tabellerna har kolumnen Förening så rader från olika föreningar kan skiljas åt.",
      ],
    },
    {
      id: "lessons",
      title: "Lektioner",
      bullets: [
        "Delad lektionskatalog (grupperad per nivo, CRUD). Endast SUPER_ADMIN har denna rutt i menyn och spärren.",
        "Spårmodell: Ilmihal (nivåbaserad), Sufara (arabiska bokstavslektioner) och Koran (fritextämnen från rapporter).",
      ],
    },
    {
      id: "communities",
      title: "Föreningar",
      bullets: [
        "Skapa föreningar (endast denna roll), inaktivera (mjuk radering), tilldela föreningsadministratörer, öppna valfri förenings flikar (Översikt, Styrelseledamöter, Händelser, Diplom) med rätt åtkomst.",
        "Global sökning i föreningslistan är endast superadmin i nuvarande gränssnitt.",
        "Styrelseväljaren listar BOARD_MEMBER-användare; att tilldela plattforms-ADMIN till en förening är ditt styrningsansvar.",
      ],
    },
    {
      id: "notifications-help-messages",
      title: "Aviseringar, Hjälp, Meddelanden",
      bullets: [
        "Hjälp inkluderar vägledning endast för superadmin när du är inloggad som det.",
        "Använd meddelanden för eskalering; trådlåsning fungerar som för admin.",
      ],
    },
    {
      id: "security",
      title: "Säkerhet och styrning",
      bullets: [
        "Skydda inloggningsuppgifter; dela aldrig superadminåtkomst.",
        "Behandla rolländringar, raderingar och föreningslivscykel som revisionskänsliga.",
        "Håll lektionsnamn och nivo konsekvent för administratörer och rapporter.",
      ],
    },
    {
      id: "weekly",
      title: "Veckoarbete",
      bullets: [
        "Verifiera nya administratörer och föreningstilldelningar.",
        "Stickprov på lektionskatalog och flerföreningsrapporter där föreningar behöver stöd.",
        "Följ upp fastnade läxköer eller rapportmönster.",
      ],
    },
  ],
};
