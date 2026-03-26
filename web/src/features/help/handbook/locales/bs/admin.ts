import type { HelpHandbookContent } from "../../types";

export const adminHandbookBs: HelpHandbookContent = {
  documentTitle: "Priručnik za imama / admina zajednice",
  intro:
    "Radite unutar dodijeljene zajednice: korisnici, djeca, izvještaji o prisustvu, objave i kartice zajednice. Ovaj priručnik vidi se samo na ADMIN nalozima.",
  sections: [
    {
      id: "nav",
      title: "Kako navigacija funkcioniše",
      bullets: [
        "Opšte: Kontrolna ploča, Objave, Pomoć, Obavijesti.",
        "Upravljanje: Korisnici, Djeca, Aktivnosti, Zajednica (jednina kada ste vezani za jednu zajednicu). Lekcije su samo SUPER_ADMIN.",
        "Gore: Prijavi aktivitosti otvara dijalog izvještaja o lekciji sa bilo koje stranice (isti alat kao super admin unutar vašeg opsega).",
      ],
    },
    {
      id: "dashboard",
      title: "Kontrolna ploča",
      bullets: [
        "Operativni pregled: kartice napretka kada važe, ova sedmica samo za čitanje na ploči (uređivanje događaja pod Zajednica → Događaji), nedavne objave sa prečicom ka Objavama.",
        "Koristite za brzi pregled; detaljni rad je u sekcijama upravljanja.",
      ],
    },
    {
      id: "posts",
      title: "Objave",
      bullets: [
        "Kreirajte, uređujte i brišite objave za vašu zajednicu; moderirajte komentare.",
        "Članovi reaguju i komentarišu. SUPER_ADMIN također može uređivati/brisati pri radu preko zajednica.",
      ],
    },
    {
      id: "users",
      title: "Korisnici",
      bullets: [
        "Imenik i životni ciklus naloga u vašoj zajednici.",
        "Kreirajte i upravljajte BOARD_MEMBER i PARENT (i naslijeđeni USER) prema pravilima; otvarajte ladice za detalje.",
        "Vaš nalog je izuzet iz tabele da slučajno ne obrišete sebe.",
        "Ne možete kreirati SUPER_ADMIN niti dodijeliti platformskog ADMIN zajednici—to je samo SUPER_ADMIN.",
      ],
    },
    {
      id: "children",
      title: "Djeca",
      bullets: [
        "Cijeli spisak zajednice: tabela, pretraga, radnje po redu.",
        "Kreiranje/ažuriranje sa obaveznim JMB, nivo, zajednica i najmanje jedan roditelj; prilagodite nivo, upis u programe (Ilmihal/Sufara/Kur'an) i veze roditelja; statusi po pravilima.",
        "Ladica za napredak i historiju. Povezani roditelji mogu uređivati podskup polja; vi vodite autoritativno mjesto i veze.",
      ],
    },
    {
      id: "activities",
      title: "Aktivnosti",
      bullets: [
        "Tabela izvještaja i kartica Red zadaća za prisustvo i praćenje.",
        "Prijavi aktivnosti (zaglavlje ili ovdje): bilježite prisustvo i zadaće po programu; Ilmihal koristi nivo + lekciju, Sufara koristi lekcije slova, Kur'an koristi slobodan unos lekcije/teme.",
        "Red zadaća: odaberite nivo + lekciju, ažurirajte zadaću po djetetu.",
        "Vaše liste su jedna zajednica—nema kolone Zajednica (super admin je vidi za više zajednica).",
      ],
    },
    {
      id: "community",
      title: "Zajednica",
      bullets: [
        "Čvor: sažetak, Uredi osnovne podatke (modal), kartice Pregled, Članovi odbora, Događaji, Diplome.",
        "Pregled: statistike i grafikoni za korisnike, djecu i nivo.",
        "Članovi odbora: prilagodite spisak gdje je dozvoljeno (automatsko čuvanje u trenutnom UX-u).",
        "Događaji: sedmični/mjesečni kalendar; kreirajte/ažurirajte/brišite prema ovlaštenju; ponavljanje po pravilima proizvoda.",
        "Diplome: PDF predložak i raspored teksta; generišite spojeni PDF u pregledaču (ograničenja u dokumentaciji proizvoda).",
      ],
    },
    {
      id: "notifications-help-messages",
      title: "Obavijesti, Pomoć, Poruke",
      bullets: [
        "Obavijesti uključuju stavke iz vaših administrativnih radnji i angažmana.",
        "Pomoć prikazuje savjete za ADMIN kada ste tako prijavljeni.",
        "Chat panel: odgovarajte roditeljima i kontekstualnim nitima; Zaključaj nit kada razgovor treba završiti (roditelji zatim počinju novu nit).",
      ],
    },
    {
      id: "boundaries",
      title: "Granice",
      bullets: [
        "Sve izmjene ostaju unutar vaše zajednice.",
        "Katalog lekcija mijenja samo SUPER_ADMIN.",
        "Dodjela imama na zajednicu može biti zaključana za vas; super admin upravlja platformskim adminima.",
      ],
    },
    {
      id: "checklist",
      title: "Dnevna kontrolna lista",
      bullets: [
        "Poruke i hitne roditeljske niti.",
        "Nacrti prisustva → Završi lekciju kada je provjereno.",
        "Red zadaća prije sljedećeg termina.",
        "Objave i događaji ostaju ažurni.",
      ],
    },
  ],
};
