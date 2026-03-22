import type { HelpHandbookContent } from "../../types";

export const boardMemberHandbookSv: HelpHandbookContent = {
  documentTitle: "Handbok för styrelseledamot",
  intro:
    "Du stödjer föreningens styrning och transparens. Du har större insyn än föräldrar på vissa ställen, men den dagliga skolverksamheten (rapporter, barnregister, publicering av inlägg) ligger hos imamer eller superadministratörer där produkten kräver det.",
  sections: [
    {
      id: "nav",
      title: "Så fungerar navigeringen",
      bullets: [
        "Allmänt: Instrumentpanel, Inlägg, Hjälp, Aviseringar.",
        "Hantering: Användare, Barn, Förening (kan visas i singular). Du ser inte Aktiviteter (rapporter) eller Lektioner.",
        "Överst: Meddelanden och aviseringar som övriga roller. Ingen genväg Rapportera aktiviteter (endast imam/superadmin).",
      ],
    },
    {
      id: "dashboard",
      title: "Instrumentpanel",
      bullets: [
        "Samma startsida som familjeroller när framsteg och veckohändelser gäller din förening.",
        "Senaste inlägg och länk till Inlägg. Använd skärmen för översikt, inte massinmatning.",
      ],
    },
    {
      id: "posts",
      title: "Inlägg",
      bullets: [
        "Läs, reagera, kommentera; redigera egna kommentarer.",
        "Att skapa nya inlägg är begränsat till community-ADMIN i app och API—samarbeta med imam eller superadmin för utskick.",
      ],
    },
    {
      id: "users",
      title: "Användare",
      bullets: [
        "Katalogvy för användare inom din behörighet.",
        "Granska listan och öppna detaljer där gränssnittet tillåter.",
        "Du kan inte skapa, redigera, ta bort eller bjuda in användare—endast ADMIN och SUPER_ADMIN har de åtgärderna.",
      ],
    },
    {
      id: "children",
      title: "Barn",
      bullets: [
        "Samma Barn-vy som för föräldrar: listan visar barn kopplade till ditt konto som vårdnadshavare. Kan vara tom utan sådana barn.",
        "Öppna rader och drawer för skrivskyddad insyn i dessa poster.",
        "Du kan inte skapa, redigera eller inaktivera barn. För hela föreningen använder imamer sina verktyg; Förening → Översikt visar aggregat.",
      ],
    },
    {
      id: "community",
      title: "Förening",
      bullets: [
        "Navet: sammanfattning, Översikt, Styrelseledamöter, Händelser med mera enligt din roll.",
        "Håll grundläggande föreningsprofil aktuell där det tillåts; hantera styrelseuppdrag enligt regler (du kan inte ta bort ditt eget uppdrag i appen).",
        "Händelser: skapa/uppdatera/radera när kalendern tillåter BOARD_MEMBER.",
        "Att tilldela plattforms-ADMIN till en förening är endast SUPER_ADMIN. Lektionskatalog och Diplom-flik ingår inte i styrelserollen i nuvarande layout.",
      ],
    },
    {
      id: "other",
      title: "Aviseringar, Hjälp, Meddelanden",
      bullets: [
        "Aviseringar och Hjälp följer din roll (inga superadmin-exklusiva handboksavsnitt här).",
        "Använd chattpanelen för kontakt med imam/admin.",
      ],
    },
    {
      id: "boundaries",
      title: "Gränser",
      bullets: [
        "Du ersätter inte ADMIN för användarlivscykel, barn-CRUD, lektionsrapporter, läxkö eller att skapa inlägg i dagens produkt.",
        "Eskalera nya föreningar, ADMIN-tilldelning eller lektionskatalog till SUPER_ADMIN.",
      ],
    },
    {
      id: "workflow",
      title: "Rekommenderat arbetssätt",
      bullets: [
        "Håll föreningsprofil och styrelseregister aktuellt.",
        "Använd Händelser för planering du har rätt att göra.",
        "Samarbeta med ADMIN kring inlägg och operativa barn/användaruppgifter.",
        "Använd meddelanden när imam/admin behövs.",
      ],
    },
  ],
};
