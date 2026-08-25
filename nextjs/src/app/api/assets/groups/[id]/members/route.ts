import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { id: groupId } = params;
    const userId = session.user.id;
    const { email, role } = await req.json();

    const group = await prisma.assetGroup.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: "Nhóm không tồn tại" }, { status: 404 });
    
    if (group.ownerId !== userId) {
      return NextResponse.json({ error: "Chỉ chủ sở hữu mới có quyền thêm thành viên" }, { status: 403 });
    }

    const memberUser = await prisma.user.findUnique({ where: { email } });
    if (!memberUser) {
      return NextResponse.json({ error: "Không tìm thấy người dùng với email này trong hệ thống" }, { status: 404 });
    }

    if (memberUser.id === userId) {
      return NextResponse.json({ error: "Không thể thêm chính mình" }, { status: 400 });
    }

    const newMember = await prisma.assetGroupMember.create({
      data: {
        groupId,
        userId: memberUser.id,
        role: role || "VIEW"
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    return NextResponse.json({ success: true, member: newMember });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Người dùng này đã có trong nhóm" }, { status: 400 });
    }
    console.error("POST /api/assets/groups/[id]/members error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
