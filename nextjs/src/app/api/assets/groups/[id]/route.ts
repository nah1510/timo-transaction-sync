import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const userId = session.user.id;

    const group = await prisma.assetGroup.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        assets: { orderBy: { createdAt: "desc" } }
      }
    });

    if (!group) {
      return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });
    }

    const isOwner = group.ownerId === userId;
    const isMember = group.members.some(m => m.userId === userId);
    
    if (!isOwner && !isMember && !session.user.is_super_admin) {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }

    return NextResponse.json({ success: true, group, isOwner });
  } catch (error: any) {
    console.error("GET /api/assets/groups/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const userId = session.user.id;

    const group = await prisma.assetGroup.findUnique({ where: { id } });
    
    if (!group) {
      return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });
    }

    if (group.ownerId !== userId && !session.user.is_super_admin) {
      return NextResponse.json({ error: "Chỉ chủ sở hữu mới được xóa nhóm" }, { status: 403 });
    }

    await prisma.assetGroup.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Đã xóa nhóm tài sản" });
  } catch (error: any) {
    console.error("DELETE /api/assets/groups/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
