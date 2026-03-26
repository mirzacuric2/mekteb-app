import type { HelpHandbookContent } from "../../types";

export const parentHandbookBs: HelpHandbookContent = {
  documentTitle: "Priručnik za roditelje i porodicu",
  intro:
    "Ovaj vodič opisuje šta vidite u Mektebu kao roditelj ili staratelj. Ne uključuje alate za imame ili platformsko osoblje—oni su namjerno skriveni s vašeg naloga.",
  sections: [
    {
      id: "nav",
      title: "Kako navigacija funkcioniše",
      bullets: [
        "Bočni meni: pod Opšte imate Kontrolnu ploču, Objave, Pomoć i Obavijesti. Pod Upravljanje vidite samo Djecu—ne vidite Korisnike, Aktivnosti (izvještaje), Lekcije ni Zajednice.",
        "Gore: Poruke (ikona pisma) otvara chat panel; Obavijesti (zvono) prikazuje nedavne stavke i link ka cijeloj listi. Ne vidite Prijavi aktivnosti (to je za imame i super administratore).",
        "Putanja kruha (breadcrumb): pokazuje u kojoj ste sekciji. Kontrolna ploča namjerno nema breadcrumb.",
      ],
    },
    {
      id: "dashboard",
      title: "Kontrolna ploča",
      bullets: [
        "Početak nakon prijave: vijesti zajednice i pregled vaše porodice.",
        "Pregled napretka: kada imate povezanu djecu, vidite kartice sa pokazateljima i sažetke po djetetu (prisustvo, zadaće, nedavna aktivnost) samo za vašu djecu. Dodir na dijete prvo otvara bočnu ladicu (URL ostaje na kontrolnoj ploči: /app/dashboard?childId=<id>&tab=…). Ikona linka pored zatvaranja otvara punu stranicu djeteta; ta stranica ima grafikone i grupiše Sufaru/Kur'an u jedan tab Programs.",
        "Pregled uključuje i zasebne kartice napretka za Sufaru i Kur'an.",
        "Ova sedmica za vašu porodicu: pregled sedmičnih događaja samo za čitanje kada nalog ima zajednicu. Ovdje ne možete kreirati ni uređivati događaje.",
        "Nedavne objave: najnovije objave sa linkom ka cijeloj sekciji Objave.",
        "Ne možete pokretati izvještaje o lekcijama, upravljati tuđom djecom ni mijenjati postavke zajednice odavde.",
      ],
    },
    {
      id: "posts",
      title: "Objave",
      bullets: [
        "Čitajte obavještenja i novosti iz vaše zajednice.",
        "Možete reagovati, komentarisati i uređivati vlastite komentare.",
        "Ne možete kreirati objave, uređivati tuđe ni brisati objave—vaš imam ili super admin vodi objavljivanje i moderaciju.",
      ],
    },
    {
      id: "children",
      title: "Djeca",
      bullets: [
        "Lista prikazuje samo djecu povezanu s vašim nalogom—ne cijeli školski spisak.",
        "Klik na red otvara bočnu ladicu (brzi napredak); ikona linka pored zatvaranja vodi na punu stranicu. Klik na ime djeteta (ikona linka) ide direktno na /app/children/<id> (grafikoni, link zajednice u zaglavlju i tabovi kao na stranici). Na punoj stranici su povezani roditelji u tabu Roditelji (kartice); dodir na karticu otvara profil roditelja u ladici.",
        "Možete uređivati dozvoljena polja (npr. ime, JMB, datum rođenja, adresa) kada je prikazana akcija uređivanja.",
        "Ne možete kreirati ni deaktivirati djecu, mijenjati zajednicu ili nivo, niti veze roditelja—to je samo za administratore.",
        "Dijeljeni linkovi koriste /app/children/<id>; dodajte ?tab=parents, lecture-progress, programs, homework-progress, sufara-progress, quran-progress (mapira se na programs na stranici) ili basic-info (basic-info je podrazumijevano ako tab nedostaje). Stari ?childId= na listi djece preusmjerava ovdje. Ladica na kontrolnoj ploči koristi /app/dashboard?childId=<id>&tab=….",
      ],
    },
    {
      id: "notifications",
      title: "Obavijesti",
      bullets: [
        "Vremenska linija obavijesti za vaš nalog (objave, zadaće, prisustvo itd.).",
        "Otvorite povezane odredišta kada postoje; označite kao pročitano.",
        "Ne možete vidjeti tuđe obavijesti.",
      ],
    },
    {
      id: "help",
      title: "Pomoć (ova stranica)",
      bullets: [
        "Savjeti prate vašu ulogu. Kao roditelj nećete vidjeti imamov ili super adminov priručnik ovdje.",
      ],
    },
    {
      id: "messages",
      title: "Poruke (chat panel)",
      bullets: [
        "Razgovarajte s imamom/adminom sa bilo koje stranice bez napuštanja prikaza.",
        "Otvarajte niti sa pokretača; šaljite u otvorenim nitima; počnite nove (uključujući iz zadaće ili komentara lekcije kada aplikacija ponudi).",
        "Ako imam/admin zaključa nit, postaje samo za čitanje—započnite novu nit za nastavak.",
      ],
    },
    {
      id: "missing",
      title: "Ako nešto nedostaje",
      bullets: [
        "Zabranjeno ili nedostaju dugmad: vaša uloga ne dozvoljava tu radnju—očekivano za upravljačke funkcije.",
        "Prazne liste: možda nemate povezanu djecu ili nema novog sadržaja—pitajte imama ako bi podaci trebali biti vidljivi.",
      ],
    },
    {
      id: "reminders",
      title: "Kratki podsjetnici",
      bullets: [
        "Čuvajte lozinku za sebe; odjavite se na zajedničkim uređajima.",
        "Koristite ovaj priručnik za roditeljski ugao.",
      ],
    },
  ],
};
