import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { User, Category, Transaction, Session, Budget } from "../src/server/models";
import { hashPassword } from "../src/server/auth/password";
import { seedDefaultCategories } from "../src/server/services/category";
import { toUtcMidnight } from "../src/lib/dates";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

async function seed() {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "expense_tracker";

  if (!uri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 5000,
  });

  console.log("Connected to MongoDB for seeding...");

  const demoEmail = "demo@auspify.com";
  let demoUser = await User.findOne({ email: demoEmail });

  const passwordHash = await hashPassword("DemoUser1234!");

  if (!demoUser) {
    demoUser = await User.create({
      name: "Demo User",
      email: demoEmail,
      passwordHash,
      currency: "USD",
      locale: "en-US",
      isDemo: true,
    });
    console.log("Created demo user:", demoEmail);
  } else {
    demoUser.name = "Demo User";
    demoUser.passwordHash = passwordHash;
    demoUser.isDemo = true;
    await demoUser.save();
    console.log("Updated existing demo user:", demoEmail);
  }

  // Clear existing demo data
  await Transaction.deleteMany({ userId: demoUser._id });
  await Budget.deleteMany({ userId: demoUser._id });
  await Session.deleteMany({ userId: demoUser._id });

  // Ensure default categories exist
  await seedDefaultCategories(demoUser._id.toString());
  const categories = await Category.find({ userId: demoUser._id });

  const catMap = new Map<string, mongoose.Types.ObjectId>();
  categories.forEach((c) => catMap.set(`${c.type}:${c.name}`, c._id as mongoose.Types.ObjectId));

  const salaryCat = catMap.get("INCOME:Salary");
  const freelanceCat = catMap.get("INCOME:Freelance");
  const investCat = catMap.get("INCOME:Investments");

  const housingCat = catMap.get("EXPENSE:Housing");
  const foodCat = catMap.get("EXPENSE:Food & Dining");
  const transportCat = catMap.get("EXPENSE:Transportation");
  const utilCat = catMap.get("EXPENSE:Utilities");
  const entertainCat = catMap.get("EXPENSE:Entertainment");
  const healthCat = catMap.get("EXPENSE:Health");
  const shopCat = catMap.get("EXPENSE:Shopping");

  const transactionsToInsert = [];
  const now = new Date();

  // Generate 6 months of data (months 0 through 5 backwards from current month)
  for (let m = 5; m >= 0; m--) {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() - m;
    const targetDate = new Date(Date.UTC(year, month, 1));
    const targetYear = targetDate.getUTCFullYear();
    const targetMonth = targetDate.getUTCMonth();

    // 1. Monthly recurring salary ($5,500 = 550,000 cents) on the 1st
    if (salaryCat) {
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "INCOME",
        amountMinor: 550000,
        categoryId: salaryCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 1))),
        note: "Monthly Software Engineering Salary",
      });
    }

    // 2. Freelance income ($850 to $1,400) on the 15th
    if (freelanceCat) {
      const freelanceAmounts = [85000, 110000, 95000, 140000, 125000, 90000];
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "INCOME",
        amountMinor: freelanceAmounts[m % freelanceAmounts.length],
        categoryId: freelanceCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 15))),
        note: "Full-Stack Web Consulting Retainer",
      });
    }

    // 3. Investment Dividend ($120 - $210) on the 22nd
    if (investCat) {
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "INCOME",
        amountMinor: 15500 + m * 800,
        categoryId: investCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 22))),
        note: "Index Fund Quarterly Dividend",
      });
    }

    // 4. Rent / Housing ($1,850 = 185,000 cents) on the 2nd
    if (housingCat) {
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "EXPENSE",
        amountMinor: 185000,
        categoryId: housingCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 2))),
        note: "Downtown Apartment Rent & Maintenance",
      });
    }

    // 5. Utilities ($140 - $190) on the 8th
    if (utilCat) {
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "EXPENSE",
        amountMinor: 14500 + (m % 3) * 1500,
        categoryId: utilCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 8))),
        note: "Fiber Internet, Electricity & Water",
      });
    }

    // 6. Transportation / Metro ($95) on the 5th
    if (transportCat) {
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "EXPENSE",
        amountMinor: 9500,
        categoryId: transportCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 5))),
        note: "Monthly Transit Pass",
      });
      // Gas / Ride hailing on 18th
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "EXPENSE",
        amountMinor: 4800,
        categoryId: transportCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 18))),
        note: "Fuel & Weekend Uber rides",
      });
    }

    // 7. Health / Gym ($120) on the 10th
    if (healthCat) {
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "EXPENSE",
        amountMinor: 12000,
        categoryId: healthCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 10))),
        note: "Fitness Membership & Vitamins",
      });
    }

    // 8. Groceries & Dining (multiple throughout month)
    if (foodCat) {
      const foodDays = [3, 7, 12, 16, 21, 25, 28];
      const foodAmounts = [6450, 11200, 4800, 9500, 5300, 13800, 7200];
      const foodNotes = [
        "Organic Valley Groceries",
        "Dinner with Friends",
        "Artisan Coffee & Bakery",
        "Weekly Supermarket Restock",
        "Lunch Bento Box",
        "Weekend Family Brunch",
        "Trader Joe's Pantry items",
      ];

      foodDays.forEach((d, idx) => {
        transactionsToInsert.push({
          userId: demoUser._id,
          type: "EXPENSE",
          amountMinor: foodAmounts[idx],
          categoryId: foodCat,
          occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, d))),
          note: foodNotes[idx],
        });
      });
    }

    // 9. Entertainment ($30 - $85) on 14th and 24th
    if (entertainCat) {
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "EXPENSE",
        amountMinor: 4500,
        categoryId: entertainCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 14))),
        note: "Cinema IMAX Tickets",
      });
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "EXPENSE",
        amountMinor: 2999,
        categoryId: entertainCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 24))),
        note: "Streaming Services & Cloud Audio",
      });
    }

    // 10. Shopping ($60 - $150) on 19th
    if (shopCat) {
      transactionsToInsert.push({
        userId: demoUser._id,
        type: "EXPENSE",
        amountMinor: 8900 + (m % 2) * 4500,
        categoryId: shopCat,
        occurredOn: toUtcMidnight(new Date(Date.UTC(targetYear, targetMonth, 19))),
        note: "Books, Electronics & Home Essentials",
      });
    }
  }

  await Transaction.insertMany(transactionsToInsert);
  console.log(
    `Successfully seeded ${transactionsToInsert.length} realistic transactions across 6 months for ${demoEmail}`
  );

  // Seed Budgets for demo user
  await Budget.deleteMany({ userId: demoUser._id });
  const demoBudgets = [
    { categoryId: housingCat, limitMinor: 200000 },
    { categoryId: foodCat, limitMinor: 65000 },
    { categoryId: transportCat, limitMinor: 25000 },
    { categoryId: utilCat, limitMinor: 22000 },
    { categoryId: shopCat, limitMinor: 15000 },
  ].filter((b) => Boolean(b.categoryId));

  await Budget.insertMany(
    demoBudgets.map((b) => ({
      userId: demoUser._id,
      categoryId: b.categoryId,
      limitMinor: b.limitMinor,
    }))
  );
  console.log(`Seeded ${demoBudgets.length} monthly category budget targets for ${demoEmail}`);

  await mongoose.disconnect();
  console.log("Database disconnected. Seed complete.");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
