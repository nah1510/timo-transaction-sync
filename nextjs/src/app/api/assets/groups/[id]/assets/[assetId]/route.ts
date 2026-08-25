import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string, assetId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const data = await req.json();
    const group = await prisma.assetGroup.findUnique({
      where: { id: params.id },
      include: { members: true }
    });
    
    if (!group) return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });

    const isOwner = group.ownerId === session.user.id;
    const member = group.members.find(m => m.userId === session.user.id);
    const canEdit = isOwner || member?.role === "EDIT";

    if (!canEdit && !session.user.is_super_admin) {
      return NextResponse.json({ error: "Không có quyền sửa" }, { status: 403 });
    }

    const updated = await prisma.asset.update({
      where: { id: params.assetId },
      data: {
        name: data.name,
        value: data.value,
        description: data.description,
        details: data.details
      }
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string, assetId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const group = await prisma.assetGroup.findUnique({
      where: { id: params.id },
      include: { members: true }
    });
    
    if (!group) return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });

    const isOwner = group.ownerId === session.user.id;
    const member = group.members.find(m => m.userId === session.user.id);
    const canEdit = isOwner || member?.role === "EDIT";

    if (!canEdit && !session.user.is_super_admin) {
      return NextResponse.json({ error: "Không có quyền xóa" }, { status: 403 });
    }

    await prisma.asset.delete({ where: { id: params.assetId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
