import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string, memberId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const { role } = await req.json();
    const group = await prisma.assetGroup.findUnique({ where: { id: params.id } });
    
    if (!group || group.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Chỉ chủ sở hữu mới có quyền sửa" }, { status: 403 });
    }

    const updated = await prisma.assetGroupMember.update({
      where: { id: params.memberId },
      data: { role }
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string, memberId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const group = await prisma.assetGroup.findUnique({ where: { id: params.id } });
    
    if (!group || group.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Chỉ chủ sở hữu mới có quyền xóa" }, { status: 403 });
    }

    await prisma.assetGroupMember.delete({ where: { id: params.memberId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
