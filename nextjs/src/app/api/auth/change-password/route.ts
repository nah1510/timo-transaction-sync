import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp đầy đủ thông tin" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: "Tài khoản của bạn chưa có mật khẩu hoặc đăng nhập qua Google. Hãy đăng xuất và dùng form đăng nhập để tạo mật khẩu mặc định." },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu hiện tại không chính xác" },
        { status: 400 }
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    return NextResponse.json({ success: true, message: "Đổi mật khẩu thành công" });

  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: "Đã xảy ra lỗi máy chủ" },
      { status: 500 }
    );
  }
}
