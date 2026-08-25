import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await props.params;
    const { id: groupId } = params;
    const userId = session.user.id;
    const data = await req.json();

    const group = await prisma.assetGroup.findUnique({
      where: { id: groupId },
      include: { members: true }
    });

    if (!group) return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });
    
    const isOwner = group.ownerId === userId;
    const member = group.members.find(m => m.userId === userId);
    const canEdit = isOwner || member?.role === "EDIT";

    if (!canEdit && !session.user.is_super_admin) {
      return NextResponse.json({ error: "Không có quyền thêm tài sản" }, { status: 403 });
    }

    const newAsset = await prisma.asset.create({
      data: {
        groupId,
        type: data.type,
        name: data.name,
        value: data.value,
        description: data.description,
        details: data.details
      }
    });

    return NextResponse.json({ success: true, asset: newAsset });
  } catch (error: any) {
    console.error("POST /api/assets/groups/[id]/assets error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
