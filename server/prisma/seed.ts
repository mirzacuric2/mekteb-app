import { CommunityStatus, LessonProgram, PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { initialLessons } from "./initial-lessons.js";

const prisma = new PrismaClient();

type SeedCommunityAddress = {
  streetLine1: string;
  streetLine2?: string;
  postalCode: string;
  city: string;
  country: string;
};

type SeedCommunity = {
  name: string;
  address: SeedCommunityAddress;
  contactPhone?: string;
};


const BIF_COMMUNITIES: SeedCommunity[] = [
  {
    name: "BIF Borås",
    address: { streetLine1: "Teknikgatan 9", postalCode: "504 62", city: "Borås", country: "Sweden" },
    contactPhone: "076 329 53 01",
  },
  {
    name: "BIF Gislaved",
    address: { streetLine1: "Sörgårdsvägen 3", postalCode: "332 37", city: "Gislaved", country: "Sweden" },
    contactPhone: "0700 257 435",
  },
  {
    name: "BIF Göteborg",
    address: { streetLine1: "Generalsgatan 5", postalCode: "415 05", city: "Göteborg", country: "Sweden" },
    contactPhone: "076 036 29 40",
  },
  {
    name: "BIF Halmstad",
    address: { streetLine1: "Gesällgatan 2 A", postalCode: "302 55", city: "Halmstad", country: "Sweden" },
    contactPhone: "0729-26 19 37",
  },
  {
    name: "BIF Helsingborg",
    address: { streetLine1: "Bjäregatan 10", postalCode: "252 48", city: "Helsingborg", country: "Sweden" },
    contactPhone: "042 457 17 30",
  },
  {
    name: "BIF Kalmar",
    address: { streetLine1: "Två Bröders Väg 35", postalCode: "39358", city: "Kalmar", country: "Sweden" },
  },
  {
    name: "BIF Karlstad",
    address: { streetLine1: "Horsensgatan 220", postalCode: "654 58", city: "Karlstad", country: "Sweden" },
    contactPhone: "0738792576",
  },
  {
    name: "BIF Landskrona",
    address: { streetLine1: "Engelbrektsgatan 5", postalCode: "261 33", city: "Landskrona", country: "Sweden" },
    contactPhone: "0418-100 83",
  },
  {
    name: "BIF Linköping",
    address: { streetLine1: "Snickaregatan 31 A", postalCode: "582 26", city: "Linköping", country: "Sweden" },
    contactPhone: "013-10 54 60",
  },
  {
    name: "BIF Malmö",
    address: {
      streetLine1: "Ystad vägen 42",
      streetLine2: "Poštanska adresa: Box 8120, 200 41 Malmö",
      postalCode: "200 41",
      city: "Malmö",
      country: "Sweden",
    },
    contactPhone: "0733583864",
  },
  {
    name: "BIF Motala",
    address: { streetLine1: "Agneshögsgatan 77", postalCode: "591 71", city: "Motala", country: "Sweden" },
    contactPhone: "0709-37 55 03",
  },
  {
    name: "BIF Norrköping",
    address: { streetLine1: "Norra Promenaden 125", postalCode: "602 22", city: "Norrköping", country: "Sweden" },
    contactPhone: "0735739659",
  },
  {
    name: "BIF Oskarshamn",
    address: { streetLine1: "Stengatan 11", postalCode: "572 55", city: "Oskarshamn", country: "Sweden" },
    contactPhone: "0738-48 61 23",
  },
  {
    name: "BIF Skövde",
    address: {
      streetLine1: "Gamla Karstorpsvägen 2",
      streetLine2: "Poštanska adresa: Box 7, 541 21 Skövde",
      postalCode: "541 41",
      city: "Skövde",
      country: "Sweden",
    },
    contactPhone: "0704 714886, 0704 970418",
  },
  {
    name: "BIF Stockholm",
    address: { streetLine1: "Frodevägen 8", postalCode: "163 43", city: "Spånga", country: "Sweden" },
    contactPhone: "08-653 68 21",
  },
  {
    name: "BIF Surte",
    address: {
      streetLine1: "Göteborgsvägen 76",
      streetLine2: "Poštanska adresa: Box 2103, 445 02 Surte",
      postalCode: "445 57",
      city: "Surte",
      country: "Sweden",
    },
    contactPhone: "0704 648762, 0707 680946",
  },
  {
    name: "BIF Trelleborg",
    address: { streetLine1: "Hedvägen 172", postalCode: "231 66", city: "Trelleborg", country: "Sweden" },
    contactPhone: "076-070 85 32",
  },
  {
    name: "BIF Trollhättan",
    address: { streetLine1: "Gjutmästaregatan 1", postalCode: "461 54", city: "Trollhättan", country: "Sweden" },
    contactPhone: "072 281 05 24",
  },
  {
    name: "BIF Varberg",
    address: { streetLine1: "Träslövsvägen 60", postalCode: "432 43", city: "Varberg", country: "Sweden" },
    contactPhone: "0340-677 374",
  },
  {
    name: "BIF Vetlanda",
    address: { streetLine1: "Kyrkogatan 39", postalCode: "574 31", city: "Vetlanda", country: "Sweden" },
    contactPhone: "0383-150 74",
  },
  {
    name: "BIF Värnamo",
    address: {
      streetLine1: "Myntgatan (gula huset)",
      streetLine2: "Västermogatan 27, Värnamo",
      postalCode: "331 30",
      city: "Värnamo",
      country: "Sweden",
    },
    contactPhone: "0370-65 76 00",
  },
  {
    name: "BIF Västerås",
    address: { streetLine1: "Ritargatan 4", postalCode: "724 66", city: "Västerås", country: "Sweden" },
    contactPhone: "0706-57 78 65",
  },
  {
    name: "BIF Växjö",
    address: { streetLine1: "Arabygatan 80", postalCode: "352 46", city: "Växjö", country: "Sweden" },
    contactPhone: "0704-07 89 42",
  },
  {
    name: "BIF Örebro",
    address: { streetLine1: "Karlslundsgatan 81", postalCode: "703 47", city: "Örebro", country: "Sweden" },
    contactPhone: "019-18 48 26",
  },
];

async function main() {
  const communityByName = new Map<string, { id: string }>();

  for (const entry of BIF_COMMUNITIES) {
    const normalizedCommunityName = entry.name.replace(/^BIF\s+/, "");

    const address = await prisma.address.upsert({
      where: {
        streetLine1_postalCode_city_country: {
          streetLine1: entry.address.streetLine1,
          postalCode: entry.address.postalCode,
          city: entry.address.city,
          country: entry.address.country,
        },
      },
      update: {
        streetLine2: entry.address.streetLine2 || undefined,
      },
      create: {
        streetLine1: entry.address.streetLine1,
        streetLine2: entry.address.streetLine2 || undefined,
        postalCode: entry.address.postalCode,
        city: entry.address.city,
        country: entry.address.country,
      },
    });

    const existingCommunity = await prisma.community.findFirst({
      where: { name: { in: [normalizedCommunityName, entry.name] } },
      select: { id: true },
    });

    const community = existingCommunity
      ? await prisma.community.update({
          where: { id: existingCommunity.id },
          data: {
            name: normalizedCommunityName,
            addressId: address.id,
            contactPhone: entry.contactPhone || undefined,
            description: "Seeded from official communities list",
            status: CommunityStatus.ACTIVE,
            deactivatedAt: null,
          },
        })
      : await prisma.community.create({
          data: {
            name: normalizedCommunityName,
            description: "Seeded from official communities list",
            contactPhone: entry.contactPhone || undefined,
            addressId: address.id,
          },
        });

    communityByName.set(normalizedCommunityName, { id: community.id });
  }

  const community = communityByName.get("Borås");
  if (!community) {
    throw new Error("Seed failed: Borås community not available");
  }

  const passwordHash = await bcrypt.hash("SuperAdmin1234!", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "mekteb.app@gmail.com" },
    update: {
      status: UserStatus.ACTIVE,
    },
    create: {
      firstName: "Super",
      lastName: "Admin",
      ssn: "197001010001",
      email: "mekteb.app@gmail.com",
      role: Role.SUPER_ADMIN,
      passwordHash,
      status: UserStatus.ACTIVE,
    },
  });

  const adminPassword = await bcrypt.hash("Admin1234!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "imam@mekteb.app" },
    update: {
      status: UserStatus.ACTIVE,
      communityId: community.id,
      invitedById: superAdmin.id,
    },
    create: {
      firstName: "Amin",
      lastName: "Imamovic",
      ssn: "198502020002",
      email: "imam@mekteb.app",
      role: Role.ADMIN,
      passwordHash: adminPassword,
      communityId: community.id,
      status: UserStatus.ACTIVE,
      invitedById: superAdmin.id,
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent@mekteb.app" },
    update: {
      status: UserStatus.ACTIVE,
      communityId: community.id,
      invitedById: admin.id,
    },
    create: {
      firstName: "Lejla",
      lastName: "Parentic",
      ssn: "199203030003",
      email: "parent@mekteb.app",
      role: Role.PARENT,
      communityId: community.id,
      invitedById: admin.id,
      status: UserStatus.ACTIVE,
      passwordHash: await bcrypt.hash("Parent1234!", 10),
    },
  });

  const child = await prisma.child.upsert({
    where: { ssn: "201405100004" },
    update: {
      firstName: "Haris",
      lastName: "Parentic",
      birthDate: new Date("2014-05-10"),
      nivo: 2,
      communityId: community.id,
    },
    create: {
      firstName: "Haris",
      lastName: "Parentic",
      ssn: "201405100004",
      birthDate: new Date("2014-05-10"),
      nivo: 2,
      communityId: community.id,
    },
  });

  await prisma.parentChild.upsert({
    where: {
      parentId_childId: {
        parentId: parent.id,
        childId: child.id,
      },
    },
    update: {},
    create: {
      parentId: parent.id,
      childId: child.id,
    },
  });

  await prisma.childProgramEnrollment.createMany({
    data: [
      { childId: child.id, program: LessonProgram.ILMIHAL },
    ],
    skipDuplicates: true,
  });

  const seededPostTitle = "Welcome to the new mekteb app";
  const seededPostContent = "We will manage attendance, posts, and child progress from one place.";
  const seededLectureTopic = "Short surahs";

  const existingPost = await prisma.post.findFirst({
    where: {
      title: seededPostTitle,
      authorId: admin.id,
      communityId: community.id,
    },
  });

  if (!existingPost) {
    await prisma.post.create({
      data: {
        title: seededPostTitle,
        content: seededPostContent,
        authorId: admin.id,
        communityId: community.id,
        comments: {
          create: [{ content: "Great update, hvala!", authorId: parent.id }],
        },
        reactions: {
          create: [{ kind: "like", userId: parent.id }],
        },
      },
    });
  }

  const existingNotification = await prisma.notification.findFirst({
    where: {
      userId: parent.id,
      type: "POST_PUBLISHED",
      title: "New post from admin",
      body: seededPostTitle,
    },
  });

  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId: parent.id,
        type: "POST_PUBLISHED",
        title: "New post from admin",
        body: seededPostTitle,
      },
    });
  }

  const existingLecture = await prisma.lecture.findFirst({
    where: {
      topic: seededLectureTopic,
      adminId: admin.id,
      communityId: community.id,
    },
  });

  if (!existingLecture) {
    await prisma.lecture.create({
      data: {
        topic: seededLectureTopic,
        note: "Good class focus.",
        adminId: admin.id,
        communityId: community.id,
        attendance: {
          create: [{ childId: child.id, present: true, comment: "On time" }],
        },
      },
    });
  }

  await prisma.lesson.createMany({
    data: initialLessons,
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
