const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Clear existing database tables
  await prisma.transaction.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.savingsTarget.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleared successfully.");

  // Hash password for credential provider signin
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create mock user
  const user = await prisma.user.create({
    data: {
      name: "Budi Santoso",
      email: "user@example.com",
      password: hashedPassword,
    },
  });

  console.log("Test user created: " + user.email);

  // Create default categories for the user
  const categoriesData = [
    { name: "Makanan", userId: user.id },
    { name: "Transportasi", userId: user.id },
    { name: "Belanja", userId: user.id },
    { name: "Tagihan", userId: user.id },
    { name: "Gaji", userId: user.id },
    { name: "Investasi", userId: user.id },
    { name: "Lainnya", userId: user.id },
  ];

  await prisma.category.createMany({
    data: categoriesData,
  });

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
  });

  const catMap = {};
  categories.forEach((c) => {
    catMap[c.name] = c.id;
  });

  console.log("Categories seeded successfully.");

  // Create Savings Target for this month
  const now = new Date();
  await prisma.savingsTarget.create({
    data: {
      userId: user.id,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      amount: 3000000, // Rp 3.000.000 savings target
    },
  });

  console.log("Savings target seeded successfully.");

  // Create mock transactions for the last 6 months to make charts look great!
  const transactions = [];
  
  // Current month transactions (some income and some expenses)
  transactions.push(
    {
      date: new Date(now.getFullYear(), now.getMonth(), 5),
      type: "INCOME",
      amount: 10000000,
      description: "Gaji Bulanan",
      categoryId: catMap["Gaji"],
      userId: user.id,
    },
    {
      date: new Date(now.getFullYear(), now.getMonth(), 10),
      type: "EXPENSE",
      amount: 1200000,
      description: "Belanja Bulanan Carrefour",
      categoryId: catMap["Belanja"],
      userId: user.id,
    },
    {
      date: new Date(now.getFullYear(), now.getMonth(), 12),
      type: "EXPENSE",
      amount: 450000,
      description: "Tagihan Listrik & Air",
      categoryId: catMap["Tagihan"],
      userId: user.id,
    },
    {
      date: new Date(now.getFullYear(), now.getMonth(), 15),
      type: "EXPENSE",
      amount: 350000,
      description: "Bensin & Tol",
      categoryId: catMap["Transportasi"],
      userId: user.id,
    },
    {
      date: new Date(now.getFullYear(), now.getMonth(), 18),
      type: "EXPENSE",
      amount: 1500000,
      description: "Investasi Reksadana",
      categoryId: catMap["Investasi"],
      userId: user.id,
    },
    {
      date: new Date(now.getFullYear(), now.getMonth(), 20),
      type: "EXPENSE",
      amount: 800000,
      description: "Makan Malam Keluarga",
      categoryId: catMap["Makanan"],
      userId: user.id,
    }
  );

  // Past 5 months transactions
  for (let i = 1; i <= 5; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();

    // Income (Fixed)
    transactions.push({
      date: new Date(y, m, 5),
      type: "INCOME",
      amount: 10000000,
      description: "Gaji Bulanan",
      categoryId: catMap["Gaji"],
      userId: user.id,
    });

    // Expenses (Varying slightly to create realistic curves on the Area chart)
    const factor = 1 - (i * 0.06); 
    transactions.push(
      {
        date: new Date(y, m, 10),
        type: "EXPENSE",
        amount: Math.round(1600000 * factor),
        description: "Belanja Supermarket",
        categoryId: catMap["Belanja"],
        userId: user.id,
      },
      {
        date: new Date(y, m, 13),
        type: "EXPENSE",
        amount: Math.round(500000 * factor),
        description: "Tagihan Rumah Tangga",
        categoryId: catMap["Tagihan"],
        userId: user.id,
      },
      {
        date: new Date(y, m, 17),
        type: "EXPENSE",
        amount: Math.round(1200000 * factor),
        description: "Reksadana Saham",
        categoryId: catMap["Investasi"],
        userId: user.id,
      },
      {
        date: new Date(y, m, 21),
        type: "EXPENSE",
        amount: Math.round(2300000 * factor),
        description: "Biaya Makan & Lain-lain",
        categoryId: catMap["Makanan"],
        userId: user.id,
      }
    );
  }

  // Create transactions sequentially
  for (const tx of transactions) {
    await prisma.transaction.create({
      data: tx,
    });
  }

  console.log("Mock transactions seeded successfully. Total seeded: " + transactions.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
