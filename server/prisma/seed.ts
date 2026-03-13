import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { legacyCommunities, legacyUsers } from "./legacy-seed-data.js";

const prisma = new PrismaClient();

async function main() {
  // Import legacy TypeORM seed baseline (community + super admin)
  const firstLegacyCommunity = legacyCommunities[0];
  const address = await prisma.address.upsert({
    where: {
      streetLine1_postalCode_city_country: {
        streetLine1: firstLegacyCommunity.street,
        postalCode: String(firstLegacyCommunity.postalCode),
        city: firstLegacyCommunity.city,
        country: firstLegacyCommunity.country,
      },
    },
    update: {},
    create: {
      streetLine1: firstLegacyCommunity.street,
      postalCode: String(firstLegacyCommunity.postalCode),
      city: firstLegacyCommunity.city,
      country: firstLegacyCommunity.country,
    },
  });

  const community = await prisma.community.upsert({
    where: { name: firstLegacyCommunity.name },
    update: {
      addressId: address.id,
    },
    create: {
      name: firstLegacyCommunity.name,
      description: "Legacy imported community",
      addressId: address.id,
    },
  });

  const legacySuperAdmin = legacyUsers[0];
  const passwordHash = await bcrypt.hash(legacySuperAdmin.password, 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: legacySuperAdmin.email },
    update: {
      isVerified: true,
      isActive: true,
    },
    create: {
      firstName: legacySuperAdmin.firstName,
      lastName: legacySuperAdmin.lastName,
      ssn: "197001010001",
      email: legacySuperAdmin.email,
      role: Role.SUPER_ADMIN,
      passwordHash,
      isVerified: true,
      isActive: true,
    },
  });

  const adminPassword = await bcrypt.hash("Admin1234!", 10);
  const admin = await prisma.user.upsert({
    where: { email: "imam@mekteb.app" },
    update: {
      isVerified: true,
      isActive: true,
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
      isVerified: true,
      isActive: true,
      invitedById: superAdmin.id,
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent@mekteb.app" },
    update: {
      isVerified: true,
      isActive: true,
      communityId: community.id,
      invitedById: admin.id,
    },
    create: {
      firstName: "Lejla",
      lastName: "Parentic",
      ssn: "199203030003",
      email: "parent@mekteb.app",
      role: Role.USER,
      communityId: community.id,
      invitedById: admin.id,
      isVerified: true,
      isActive: true,
      passwordHash: await bcrypt.hash("Parent1234!", 10),
    },
  });

  const child = await prisma.child.upsert({
    where: { ssn: "201405100004" },
    update: {
      firstName: "Haris",
      lastName: "Parentic",
      birthDate: new Date("2014-05-10"),
      level: "2",
      communityId: community.id,
    },
    create: {
      firstName: "Haris",
      lastName: "Parentic",
      ssn: "201405100004",
      birthDate: new Date("2014-05-10"),
      level: "2",
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

  await prisma.post.create({
    data: {
      title: "Welcome to the new mekteb app",
      content: "We will track attendance, posts, and child progress from one place.",
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

  await prisma.notification.create({
    data: {
      userId: parent.id,
      type: "POST_PUBLISHED",
      title: "New post from admin",
      body: "Welcome to the new mekteb app",
    },
  });

  await prisma.lecture.create({
    data: {
      topic: "Short surahs",
      heldAt: new Date(),
      note: "Good class focus.",
      adminId: admin.id,
      communityId: community.id,
      attendance: {
        create: [{ childId: child.id, present: true, comment: "On time" }],
      },
    },
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
