import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const savingsTargetSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  amount: z.number().nonnegative("Target tabungan harus berupa angka positif"),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const monthParam = searchParams.get("month");
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

    if (monthParam === "all") {
      const targets = await db.savingsTarget.findMany({
        where: {
          userId: session.user.id,
          year,
        },
      });
      return NextResponse.json(targets);
    }

    const month = parseInt(monthParam || String(now.getMonth() + 1));

    const target = await db.savingsTarget.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month,
          year,
        },
      },
    });

    return NextResponse.json(target || { month, year, amount: 0 });
  } catch (error) {
    console.error("GET Savings Target Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = savingsTargetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: result.error.issues[0].message }, { status: 400 });
    }

    const { month, year, amount } = result.data;
    const userId = session.user.id;

    // Upsert savings target using the composite unique key
    const target = await db.savingsTarget.upsert({
      where: {
        userId_month_year: {
          userId,
          month,
          year,
        },
      },
      update: {
        amount,
      },
      create: {
        userId,
        month,
        year,
        amount,
      },
    });

    return NextResponse.json(target);
  } catch (error) {
    console.error("POST Savings Target Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
