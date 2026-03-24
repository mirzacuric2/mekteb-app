import type { HelpHandbookContent } from "../../types";

export const parentHandbookSv: HelpHandbookContent = {
  documentTitle: "Handbok för vårdnadshavare och familj",
  intro:
    "Den här guiden beskriver vad du ser i Mekteb som förälder eller vårdnadshavare. Den innehåller inte verktyg för imamer eller plattformspersonal—de är dolda från ditt konto med flit.",
  sections: [
    {
      id: "nav",
      title: "Så fungerar navigeringen",
      bullets: [
        "Sidomeny: under Allmänt har du Instrumentpanel, Inlägg, Hjälp och Aviseringar. Under Hantering ser du bara Barn—inte Användare, Aktiviteter (rapporter), Lektioner eller Föreningar.",
        "Överst: Meddelanden (brevikon) öppnar chattpanelen; Aviseringar (klocka) visar de senaste och en länk till hela listan. Du ser inte Rapportera aktiviteter (det är för imamer och superadministratörer).",
        "Brödsmulor: visar vilken sektion du är i. Instrumentpanelen har inga brödsmulor avsiktligt.",
      ],
    },
    {
      id: "dashboard",
      title: "Instrumentpanel",
      bullets: [
        "Startsida efter inloggning: nyheter från föreningen och en överblick över er familj.",
        "Framsteg: när du har kopplade barn ser du kort med nyckeltal och summering per barn (närvaro, läxor, senaste aktivitet) endast för dina barn. Tryck på ett barn under totala framsteget öppnar lådan på fliken lecture-progress; under läxframsteg öppnas homework-progress. URL:en använder ?childId=…&tab=… så du kan uppdatera eller dela samma vy.",
        "Den här veckan för er familj: skrivskyddad veckokalender när ditt konto har en förening. Du kan inte skapa eller redigera händelser här.",
        "Senaste inlägg: de nyaste inläggen med länk till hela Inlägg.",
        "Du kan inte köra lektionsrapporter, hantera andras barn eller ändra föreningsinställningar härifrån.",
      ],
    },
    {
      id: "posts",
      title: "Inlägg",
      bullets: [
        "Läs meddelanden och uppdateringar från er förening.",
        "Du kan reagera, kommentera och redigera dina egna kommentarer.",
        "Du kan inte skapa inlägg, redigera andras eller ta bort inlägg—er imam eller superadmin hanterar publicering och moderering.",
      ],
    },
    {
      id: "children",
      title: "Barn",
      bullets: [
        "Listan visar bara barn som är kopplade till ditt konto—inte hela skolans register.",
        "Öppna en rad för detaljer i sidodrawern: framsteg, läxor och närvarorelaterad historik när den registrerats.",
        "Du kan redigera tillåtna fält (t.ex. namn, personnummer, födelsedatum, adress) när redigeringsåtgärden visas.",
        "Du kan inte skapa eller inaktivera barn, byta förening eller nivo, eller ändra föräldralänkar—det är endast för administratörer.",
        "Delade länkar kan använda ?childId=<id> för att öppna samma drawer; lägg till &tab=basic-info, lecture-progress eller homework-progress för att landa på en flik (standard är basic-info om tab utelämnas).",
      ],
    },
    {
      id: "notifications",
      title: "Aviseringar",
      bullets: [
        "Tidslinje med aviseringar för ditt konto (inlägg, läxor, närvaro med mera).",
        "Öppna länkade mål när de finns; markera som lästa.",
        "Du kan inte se andra användares aviseringar.",
      ],
    },
    {
      id: "help",
      title: "Hjälp (den här sidan)",
      bullets: [
        "Vägledningen följer din roll. Som förälder ser du inte imam- eller superadmin-handbok här.",
      ],
    },
    {
      id: "messages",
      title: "Meddelanden (chattpanel)",
      bullets: [
        "Prata med imam/admin från vilken sida som helst utan att lämna vyn.",
        "Öppna trådar från startknappen; skicka i öppna trådar; starta nya (inklusive från läxa eller lektionskommentar när appen erbjuder det).",
        "Om imam/admin låser en tråd blir den skrivskyddad—starta en ny tråd för uppföljning.",
      ],
    },
    {
      id: "missing",
      title: "Om något saknas",
      bullets: [
        "Förbjudet eller saknade knappar: din roll tillåter inte åtgärden—förväntat för hanteringsfunktioner.",
        "Tomma listor: du kanske inte har kopplade barn ännu, eller inget nytt innehåll—fråga er imam om data borde synas.",
      ],
    },
    {
      id: "reminders",
      title: "Snabbpåminnelser",
      bullets: [
        "Håll lösenordet för dig själv; logga ut på delade enheter.",
        "Använd den här handboken för föräldraperspektiv.",
      ],
    },
  ],
};
