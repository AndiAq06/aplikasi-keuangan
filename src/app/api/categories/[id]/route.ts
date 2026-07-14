import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(50, "Nama kategori terlalu panjang"),
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
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: result.error.issues[0].message }, { status: 400 });
    }

    const { name } = result.data;
    const userId = session.user.id;

    // Check category ownership
    const category = await db.category.findUnique({
      where: { id },
    });

    if (!category || category.userId !== userId) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }

    // Check duplicate name for the same user
    const existing = await db.category.findUnique({
      where: {
        name_userId: {
          name,
          userId,
        },
      },
    });

    if (existing && existing.id !== id) {
      return NextResponse.json({ message: "Kategori dengan nama ini sudah ada" }, { status: 400 });
    }

    const updated = await db.category.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT Category Error:", error);
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

    // Check category ownership
    const category = await db.category.findUnique({
      where: { id },
    });

    if (!category || category.userId !== userId) {
      return NextResponse.json({ message: "Kategori tidak ditemukan" }, { status: 404 });
    }

    // Delete category
    await db.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error) {
    console.error("DELETE Category Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
