import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const groups = await prisma.assetGroup.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: { userId: userId }
            }
          }
        ]
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, userId: true, role: true } },
        _count: { select: { assets: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, groups });
  } catch (error: any) {
    console.error("GET /api/assets/groups error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Vui lòng nhập tên nhóm tài sản" }, { status: 400 });
    }

    const newGroup = await prisma.assetGroup.create({
      data: {
        name,
        description,
        ownerId: session.user.id
      }
    });

    return NextResponse.json({ success: true, group: newGroup });
  } catch (error: any) {
    console.error("POST /api/assets/groups error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
