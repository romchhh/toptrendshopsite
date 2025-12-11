import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getAuthUser } from '@/lib/middleware-auth';
import sharp from 'sharp';

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

    // Перевірка типу файлу - має бути зображення
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const fileType = file.type.toLowerCase();
    
    if (!allowedTypes.includes(fileType) && !file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      return NextResponse.json(
        { error: 'Непідтримуваний формат файлу. Дозволені формати: JPG, PNG, GIF, WEBP, SVG' },
        { status: 400 }
      );
    }

    // Перевірка розміру файлу (10 МБ максимум)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Файл занадто великий. Максимальний розмір: 10 МБ' },
        { status: 400 }
      );
    }

    console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size, 'bytes');

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
    // Очищаємо ім'я від спеціальних символів
    const originalName = file.name;
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    // Створюємо директорію, якщо вона не існує
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Конвертуємо в webp (крім SVG)
    let filename: string;
    let outputBuffer: Buffer;
    
    if (extension === 'svg') {
      // SVG зберігаємо як є
      filename = `${timestamp}-${sanitizedName}.svg`;
      outputBuffer = buffer;
    } else {
      // Конвертуємо в webp
      filename = `${timestamp}-${sanitizedName}.webp`;
      try {
        outputBuffer = await sharp(buffer)
          .webp({ quality: 85 })
          .toBuffer();
        console.log('Image converted to webp, original size:', buffer.length, 'webp size:', outputBuffer.length);
      } catch (sharpError) {
        console.error('Sharp conversion error:', sharpError);
        // Якщо не вдалося конвертувати, зберігаємо оригінал
        filename = `${timestamp}-${sanitizedName}.${extension}`;
        outputBuffer = buffer;
      }
    }
    
    console.log('Original filename:', originalName, 'Final filename:', filename);
    const filePath = join(uploadsDir, filename);

    await writeFile(filePath, outputBuffer);

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

