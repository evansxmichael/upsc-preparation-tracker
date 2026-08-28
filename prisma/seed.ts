import { db } from "../src/lib/db";
import { INITIAL_SYLLABUS } from "../src/data/syllabus/full-syllabus";
import bcrypt from "bcryptjs";

// Safe CategoryTier definition matching Prisma schema enum
const CategoryTier = {
  FOUNDATION: "FOUNDATION",
  PRELIMS: "PRELIMS",
  MAINS: "MAINS",
  QUALIFYING: "QUALIFYING",
} as const;

type CategoryTierType =
  (typeof CategoryTier)[keyof typeof CategoryTier];

async function main() {
  console.log("🌱 Seeding UPSC database...");

  // 1. Admin credentials MUST come from environment variables
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    throw new Error(
      "❌ ADMIN_EMAIL is not configured in the environment."
    );
  }

  if (!adminPassword) {
    throw new Error(
      "❌ ADMIN_PASSWORD is not configured in the environment."
    );
  }

  if (adminPassword.length < 9) {
    throw new Error(
      "❌ ADMIN_PASSWORD must be at least 12 characters long."
    );
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create or upgrade the primary admin account
  const admin = await db.user.upsert({
    where: { email: adminEmail },

    update: {
      role: "ADMIN",
      status: "APPROVED",
      password: hashedPassword,
    },

    create: {
      name: "xishaan",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  console.log(`👑 Admin user ready: ${admin.email}`);

  // 2. Wipe existing syllabus hierarchy to avoid duplicate tree builds
  await db.syllabusCategory.deleteMany({});

  // 3. Create / update user-scoped settings for the admin
  await db.systemSettings.upsert({
    where: { userId: admin.id },

    update: {},

    create: {
      userId: admin.id,
      prelimsTargetDate: new Date("2027-05-23T00:00:00.000Z"),
      mainsTargetDate: new Date("2027-09-17T00:00:00.000Z"),
      interviewDate: new Date("2028-02-15T00:00:00.000Z"),
      dailyTargetHours: 6.0,
      targetYear: 2027,
      optionalSubject: "Sociology",
    },
  });

  const tierMapping: Record<string, CategoryTierType> = {
    foundation: CategoryTier.FOUNDATION,
    prelims: CategoryTier.PRELIMS,
    mains: CategoryTier.MAINS,
    "mains-qualifying": CategoryTier.QUALIFYING,
  };

  // 4. Seed Global Syllabus Template Tree
  // userId = null means system template
  for (let cIdx = 0; cIdx < INITIAL_SYLLABUS.length; cIdx++) {
    const cat = INITIAL_SYLLABUS[cIdx];
    const tier =
      tierMapping[cat.id] ?? CategoryTier.FOUNDATION;

    const createdCategory =
      await db.syllabusCategory.create({
        data: {
          title: cat.categoryTitle,
          subTitle: cat.subTitle,
          tier,
          orderIndex: cIdx,
        },
      });

    for (
      let sIdx = 0;
      sIdx < cat.subjects.length;
      sIdx++
    ) {
      const sub = cat.subjects[sIdx];

      const createdSubject = await db.subject.create({
        data: {
          name: sub.name,
          orderIndex: sIdx,
          categoryId: createdCategory.id,
          userId: null,
        },
      });

      const topicData = sub.topics.map(
        (topic, tIdx) => ({
          title: topic.title,
          orderIndex: tIdx,
          subjectId: createdSubject.id,
          userId: null,
        })
      );

      if (topicData.length > 0) {
        await db.topic.createMany({
          data: topicData,
        });
      }
    }
  }

  console.log(
    "✅ Syllabus hierarchy & Admin account seeded successfully!"
  );
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });