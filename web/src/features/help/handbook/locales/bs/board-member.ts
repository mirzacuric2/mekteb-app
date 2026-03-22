import type { HelpHandbookContent } from "../../types";

export const boardMemberHandbookBs: HelpHandbookContent = {
  documentTitle: "Priručnik za člana upravnog odbora",
  intro:
    "Podržavate upravljanje zajednicom i transparentnost. Imate veći uvid od roditelja na nekim mjestima, ali svakodnevna školska operativa (izvještaji, evidencija djece, objavljivanje postova) ostaje kod imama ili super admina gdje to proizvod zahtijeva.",
  sections: [
    {
      id: "nav",
      title: "Kako navigacija funkcioniše",
      bullets: [
        "Opšte: Kontrolna ploča, Objave, Pomoć, Obavijesti.",
        "Upravljanje: Korisnici, Djeca, Zajednica (može biti u jednini). Ne vidite Aktivnosti (izvještaje) ni Lekcije.",
        "Gore: Poruke i obavijesti kao druge uloge. Nema prečice Prijavi aktivnosti (samo imam/super admin).",
      ],
    },
    {
      id: "dashboard",
      title: "Kontrolna ploča",
      bullets: [
        "Isti početni prikaz kao porodične uloge kada napredak i sedmični događaji važe za vašu zajednicu.",
        "Nedavne objave i link ka Objavama. Koristite ekran za nadzor, ne za masovni unos.",
      ],
    },
    {
      id: "posts",
      title: "Objave",
      bullets: [
        "Čitajte, reagujte, komentarišite; uređujte vlastite komentare.",
        "Kreiranje novih objava ograničeno je na community-ADMIN u aplikaciji i API—dogovorite se s imamom ili super adminom za objave.",
      ],
    },
    {
      id: "users",
      title: "Korisnici",
      bullets: [
        "Pregled korisnika u okviru vašeg pristupa.",
        "Pregledajte listu i otvarajte detalje gdje interfejs dozvoljava.",
        "Ne možete kreirati, uređivati, brisati niti pozivati korisnike—samo ADMIN i SUPER_ADMIN imaju te akcije.",
      ],
    },
    {
      id: "children",
      title: "Djeca",
      bullets: [
        "Ista ruta Djeca kao za roditelje: lista prikazuje djecu povezanu s vašim nalogom kao staratelj. Može biti prazna ako nemate takvu djecu.",
        "Otvorite redove i ladicu za uvid samo za čitanje u tim zapisima.",
        "Ne možete kreirati, uređivati ni deaktivirati djecu. Za cijelu zajednicu imami koriste svoje alate; Zajednica → Pregled prikazuje agregate.",
      ],
    },
    {
      id: "community",
      title: "Zajednica",
      bullets: [
        "Čvor: sažetak, Pregled, Članovi odbora, Događaji i druge kartice prema vašoj ulozi.",
        "Održavajte osnovni profil zajednice gdje je dozvoljeno; upravljajte članstvom u odboru po pravilima (ne možete ukloniti vlastivo članstvo u aplikaciji).",
        "Događaji: kreirajte/ažurirajte/brišite kada kalendar dozvoljava BOARD_MEMBER.",
        "Dodjela platformskog ADMIN zajednici je samo SUPER_ADMIN. Katalog lekcija i kartica Diplome nisu u ulozi odbora u trenutnom rasporedu.",
      ],
    },
    {
      id: "other",
      title: "Obavijesti, Pomoć, Poruke",
      bullets: [
        "Obavijesti i Pomoć prate vašu ulogu (nema dijelova priručnika samo za super admina ovdje).",
        "Koristite chat panel za koordinaciju s imamom/adminom.",
      ],
    },
    {
      id: "boundaries",
      title: "Granice",
      bullets: [
        "Ne zamjenjujete ADMIN u životnom ciklusu korisnika, CRUD djece, izvještajima o lekcijama, redu zadaća ni kreiranju objava u današnjem proizvodu.",
        "Eskalirajte nove zajednice, dodjelu ADMIN ili katalog lekcija SUPER_ADMIN-u.",
      ],
    },
    {
      id: "workflow",
      title: "Preporučeni tok rada",
      bullets: [
        "Održavajte profil zajednice i spisak odbora tačnim.",
        "Koristite Događaje za planiranje koje smijete raditi.",
        "Saradujte s ADMIN-om oko objava i operativnih podataka o djeci/korisnicima.",
        "Koristite poruke kada treba imam/admin.",
      ],
    },
  ],
};
