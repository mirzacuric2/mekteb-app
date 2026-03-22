import type { HelpHandbookContent } from "../../types";

export const superAdminHandbookBs: HelpHandbookContent = {
  documentTitle: "Priručnik za super administratora",
  intro:
    "Radite preko zajednica: korisnici, zajednice, katalog lekcija i izvještavanje sa kontekstom više zajednica. Ovaj priručnik vidi se samo na SUPER_ADMIN nalozima.",
  sections: [
    {
      id: "nav",
      title: "Kako navigacija funkcioniše",
      bullets: [
        "Bočni meni: isto kao admini plus Lekcije pod Upravljanje.",
        "Zajednice: otvorite listu na /app/communities, zatim rutu detalja /app/communities/:id za odabranu zajednicu.",
        "Gore: Prijavi aktivnosti sa širim uvidom u podatke nego admin jedne zajednice.",
      ],
    },
    {
      id: "dashboard",
      title: "Kontrolna ploča",
      bullets: [
        "Početak: nedavne objave i navigacija dalje.",
        "KPI kartice napretka i pregled sedmičnih događaja nisu prikazani za SUPER_ADMIN u trenutnoj aplikaciji—koristite Djeca, Aktivnosti i detalj Zajednice za operativni uvid.",
      ],
    },
    {
      id: "posts",
      title: "Objave",
      bullets: [
        "Čitajte i moderirajte kao admin. Kreiranje objava može biti ograničeno na community-ADMIN u API-ju—koristite patch/brisanje i moderaciju gdje je dozvoljeno, ili dogovor sa ADMIN-om zajednice za nove objave ako je POST ograničen.",
      ],
    },
    {
      id: "users",
      title: "Korisnici",
      bullets: [
        "Sve zajednice (pretraga, filteri, straničenje prema implementaciji).",
        "Kreirajte korisnike kao ADMIN, BOARD_MEMBER ili PARENT; premještajte korisnike između zajednica; puno uređivanje/brisanje unutar politike.",
      ],
    },
    {
      id: "children",
      title: "Djeca",
      bullets: [
        "Pregled preko zajednica kada treba; odabir zajednice pri kreiranju/ažuriranju gdje postoji.",
        "Smanjite izlaganje osjetljivih polja (JMB) prema pravilima upravljanja.",
      ],
    },
    {
      id: "activities",
      title: "Aktivnosti",
      bullets: [
        "Isti Izvještaji i Red zadaća kao ADMIN, sa kontekstom više zajednica.",
        "Tabele uključuju kolonu Zajednica da se redovi iz različitih zajednica razlikuju.",
      ],
    },
    {
      id: "lessons",
      title: "Lekcije",
      bullets: [
        "Zajednički katalog lekcija (grupisano po nivou, CRUD). Samo SUPER_ADMIN ima ovu rutu u meniju i zaštiti rute.",
      ],
    },
    {
      id: "communities",
      title: "Zajednice",
      bullets: [
        "Kreirajte zajednice (samo ova uloga), deaktivirajte (meko brisanje), dodijelite administratore zajednice, otvarajte kartice bilo koje zajednice (Pregled, Članovi odbora, Događaji, Diplome) s odgovarajućim pristupom.",
        "Globalna pretraga liste zajednica je samo za super admina u trenutnom interfejsu.",
        "Birač članova odbora prikazuje BOARD_MEMBER korisnike; dodjela platformskog ADMIN zajednici je vaša odgovornost u upravljanju.",
      ],
    },
    {
      id: "notifications-help-messages",
      title: "Obavijesti, Pomoć, Poruke",
      bullets: [
        "Pomoć uključuje savjete samo za super admina kada ste tako prijavljeni.",
        "Koristite poruke za eskalacije; zaključavanje niti kao kod admina.",
      ],
    },
    {
      id: "security",
      title: "Sigurnost i upravljanje",
      bullets: [
        "Čuvajte vjerodajnice; nikad ne dijelite super admin pristup.",
        "Tretirajte promjene uloga, brisanja i životni ciklus zajednice kao osjetljive na reviziju.",
        "Držite imena lekcija i nivo dosljednim za admine i izvještaje.",
      ],
    },
    {
      id: "weekly",
      title: "Sedmični posao",
      bullets: [
        "Provjerite nove admine i dodjele zajednicama.",
        "Uzorci kataloga lekcija i izvještaja preko zajednica gdje treba podrška.",
        "Pratite zaglavljene redove zadaća ili obrasce izvještaja.",
      ],
    },
  ],
};
