import { NextRequest, NextResponse } from 'next/server';
import { signToken, getAdminCredentials } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const admin = getAdminCredentials();

    if (username !== admin.username || password !== admin.password) {
      return NextResponse.json(
        { error: 'Невірний логін або пароль' },
        { status: 401 }
      );
    }

    const token = await signToken({ username });

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 години
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}

