import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const transactionSchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Nominal harus lebih besar dari 0"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().optional().default(""),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = transactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: result.error.issues[0].message }, { status: 400 });
    }

    const { date, type, amount, categoryId, description } = result.data;
    const userId = session.user.id;

    // Check if transaction exists and belongs to the user
    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.userId !== userId) {
      return NextResponse.json({ message: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    // Check if new category exists and belongs to the user
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.userId !== userId) {
      return NextResponse.json({ message: "Kategori tidak valid" }, { status: 400 });
    }

    const updated = await db.transaction.update({
      where: { id },
      data: {
        date,
        type,
        amount,
        categoryId,
        description,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT Transaction Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check if transaction exists and belongs to the user
    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.userId !== userId) {
      return NextResponse.json({ message: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    await db.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Transaksi berhasil dihapus" });
  } catch (error) {
    console.error("DELETE Transaction Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
