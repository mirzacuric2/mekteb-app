import type { HelpHandbookContent } from "../../types";

export const adminHandbookSv: HelpHandbookContent = {
  documentTitle: "Handbok för imam / föreningsadministratör",
  intro:
    "Du arbetar inom din tilldelade förening: användare, barn, närvarorapporter, inlägg och föreningsflikar. Denna handbok visas endast för ADMIN-konton.",
  sections: [
    {
      id: "nav",
      title: "Så fungerar navigeringen",
      bullets: [
        "Allmänt: Instrumentpanel, Inlägg, Hjälp, Aviseringar.",
        "Hantering: Användare, Barn, Aktiviteter, Förening (singular när du är låst till en förening). Lektioner är endast SUPER_ADMIN.",
        "Överst: Rapportera aktiviteter öppnar lektionsrapportdialogen från vilken sida som helst (samma verktyg som superadmin inom ditt område).",
      ],
    },
    {
      id: "dashboard",
      title: "Instrumentpanel",
      bullets: [
        "Operativ överblick: framstegskort när det gäller, skrivskyddad denna vecka på instrumentpanelen (redigera händelser under Förening → Händelser), senaste inlägg med genväg till Inlägg.",
        "Använd för snabb koll; djupare arbete sker i hanteringssektionerna.",
      ],
    },
    {
      id: "posts",
      title: "Inlägg",
      bullets: [
        "Skapa, redigera och ta bort inlägg för er förening; moderera kommentarer.",
        "Medlemmar reagerar och kommenterar. SUPER_ADMIN kan också redigera/ta bort vid arbete över föreningar.",
      ],
    },
    {
      id: "users",
      title: "Användare",
      bullets: [
        "Katalog och livscykel för konton i er förening.",
        "Skapa och hantera BOARD_MEMBER och PARENT (och äldre USER) enligt policy; öppna lådor för detaljer.",
        "Ditt eget konto ingår inte i tabellen så du inte raderar dig själv av misstag.",
        "Du kan inte skapa SUPER_ADMIN eller tilldela plattforms-ADMIN till en förening—det är endast SUPER_ADMIN.",
      ],
    },
    {
      id: "children",
      title: "Barn",
      bullets: [
        "Hela föreningens register: tabell, sökning, radåtgärder.",
        "Skapa/uppdatera med krav på personnummer, nivo, förening och minst en förälder; justera nivo och föräldralänkar; status enligt regler.",
        "Drawer för framsteg och historik. Kopplade föräldrar kan redigera delmängd av fält; du ansvarar för placering och länkar.",
      ],
    },
    {
      id: "activities",
      title: "Aktiviteter",
      bullets: [
        "Rapporttabell och fliken Läxkö för närvaro och uppföljning.",
        "Rapportera aktiviteter (header eller här): fånga närvaro och läxor per nivo; spara utkast; slutför lektioner när alla rader är klara och lektioner valda.",
        "Läxkö: välj nivo + lektion, uppdatera läxa per barn.",
        "Dina listor är en-förening—ingen kolumn Förening (superadmin ser den för flera föreningar).",
      ],
    },
    {
      id: "community",
      title: "Förening",
      bullets: [
        "Nav: sammanfattning, Redigera grundinfo (modal), flikar som Översikt, Styrelseledamöter, Händelser, Diplom.",
        "Översikt: statistik och diagram för användare, barn och nivo.",
        "Styrelseledamöter: justera register där det tillåts (autospar i nuvarande UX).",
        "Händelser: vecko/månadskalender; skapa/uppdatera/radera enligt behörighet; upprepning enligt produktregler.",
        "Diplom: PDF-mall och textlayout; generera sammanslagna PDF:er i webbläsaren (se produktdokumentation för gränser).",
      ],
    },
    {
      id: "notifications-help-messages",
      title: "Aviseringar, Hjälp, Meddelanden",
      bullets: [
        "Aviseringar inkluderar händelser från dina administrativa åtgärder och engagemang.",
        "Hjälp visar vägledning för ADMIN när du är inloggad som det.",
        "Chattpanel: svara föräldrar och kontexttrådar; Lås tråd när samtal ska avslutas (föräldrar startar ny tråd därefter).",
      ],
    },
    {
      id: "boundaries",
      title: "Gränser",
      bullets: [
        "Alla ändringar stannar inom er förening.",
        "Lektionskatalog ändras endast av SUPER_ADMIN.",
        "Imam-tilldelning på förening kan vara skrivskyddad för dig; superadmin styr plattformsadministratörer.",
      ],
    },
    {
      id: "checklist",
      title: "Daglig checklista",
      bullets: [
        "Meddelanden och brådskande föräldratrådar.",
        "Närvaroutkast → Slutför lektion när det är verifierat.",
        "Läxkö före nästa pass.",
        "Inlägg och händelser hålls aktuella.",
      ],
    },
  ],
};
