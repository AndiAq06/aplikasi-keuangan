import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(50, "Nama kategori terlalu panjang"),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const categories = await db.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET Categories Error:", error);
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
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: result.error.issues[0].message }, { status: 400 });
    }

    const { name } = result.data;
    const userId = session.user.id;

    // Check duplicate category name for the current user
    const existing = await db.category.findUnique({
      where: {
        name_userId: {
          name,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Kategori dengan nama ini sudah ada" }, { status: 400 });
    }

    const category = await db.category.create({
      data: {
        name,
        userId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("POST Category Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
