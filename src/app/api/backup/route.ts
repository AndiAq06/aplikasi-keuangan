import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const categories = await db.category.findMany({
      where: { userId },
    });

    const transactions = await db.transaction.findMany({
      where: { userId },
    });

    const savingsTargets = await db.savingsTarget.findMany({
      where: { userId },
    });

    const backupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      email: session.user.email,
      categories,
      transactions,
      savingsTargets,
    };

    return NextResponse.json(backupData);
  } catch (error) {
    console.error("Backup Export Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    const { categories, transactions, savingsTargets } = body;

    if (!Array.isArray(categories) || !Array.isArray(transactions) || !Array.isArray(savingsTargets)) {
      return NextResponse.json({ message: "Format data backup tidak valid" }, { status: 400 });
    }

    // Restore data inside database transaction
    await db.$transaction(async (tx) => {
      // 1. Delete all existing user transactions (cascade concerns)
      await tx.transaction.deleteMany({
        where: { userId },
      });

      // 2. Delete all existing user categories
      await tx.category.deleteMany({
        where: { userId },
      });

      // 3. Delete all existing user savings targets
      await tx.savingsTarget.deleteMany({
        where: { userId },
      });

      // 4. Restore categories (forcing current userId for security)
      if (categories.length > 0) {
        await tx.category.createMany({
          data: categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            userId,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          })),
        });
      }

      // 5. Restore transactions (forcing current userId for security)
      if (transactions.length > 0) {
        await tx.transaction.createMany({
          data: transactions.map((t: any) => ({
            id: t.id,
            date: new Date(t.date),
            type: t.type,
            amount: parseFloat(t.amount),
            description: t.description || "",
            categoryId: t.categoryId,
            userId,
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
          })),
        });
      }

      // 6. Restore savings targets (forcing current userId for security)
      if (savingsTargets.length > 0) {
        await tx.savingsTarget.createMany({
          data: savingsTargets.map((s: any) => ({
            id: s.id,
            month: parseInt(s.month),
            year: parseInt(s.year),
            amount: parseFloat(s.amount),
            userId,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
          })),
        });
      }
    });

    return NextResponse.json({ message: "Data berhasil dipulihkan" });
  } catch (error) {
    console.error("Backup Restore Error:", error);
    return NextResponse.json({ message: "Format backup rusak atau tidak kompatibel" }, { status: 500 });
  }
}
