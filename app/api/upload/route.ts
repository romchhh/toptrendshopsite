import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getAuthUser } from '@/lib/middleware-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Не авторизовано' }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не знайдено' }, { status: 400 });
    }

    // Перевірка розміру файлу (10 МБ максимум)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Файл занадто великий. Максимальний розмір: 10 МБ' },
        { status: 400 }
      );
    }

    console.log('Uploading file:', file.name, 'Size:', file.size, 'bytes');

    let bytes: ArrayBuffer;
    let buffer: Buffer;
    
    try {
      bytes = await file.arrayBuffer();
      console.log('File arrayBuffer created, length:', bytes.byteLength);
      
      buffer = Buffer.from(bytes);
      console.log('Buffer created, length:', buffer.length);
    } catch (bufferError) {
      console.error('Error reading file:', bufferError);
      return NextResponse.json(
        { error: 'Помилка обробки файлу. Можливо файл занадто великий або пошкоджений.' },
        { status: 413 }
      );
    }

    const timestamp = Date.now();
    // Очищаємо ім'я файлу від спеціальних символів та пробілів
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadsDir, filename);

    // Створюємо директорію, якщо вона не існує
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    await writeFile(filePath, buffer);

    // Перевіряємо, чи файл реально створено
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      throw new Error('Файл не був створений після запису');
    }

    console.log('File uploaded successfully:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    console.log('File size:', fs.statSync(filePath).size);

    return NextResponse.json({ 
      success: true, 
      url: `/api/uploads/${filename}` 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Помилка завантаження файлу', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

