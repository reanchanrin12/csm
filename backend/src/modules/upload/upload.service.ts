import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'vehicles');

  constructor() {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Saves a base64 encoded image data string to server disk
   * @param base64Data e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
   * @returns relative web path e.g. "/uploads/vehicles/uuid.jpg"
   */
  saveBase64Image(base64Data: string): { url: string } {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new BadRequestException('Invalid image data');
    }

    // Match mime type and base64 payload
    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    let extension = 'jpg';
    let rawBase64 = base64Data;

    if (matches && matches[1] && matches[2]) {
      extension = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
      rawBase64 = matches[2];
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    // Max 10MB file limit validation
    if (buffer.length > 10 * 1024 * 1024) {
      throw new BadRequestException('Image size exceeds 10MB limit');
    }

    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const fullPath = join(this.uploadDir, filename);

    writeFileSync(fullPath, buffer);

    return {
      url: `/uploads/vehicles/${filename}`,
    };
  }

  /**
   * Saves a binary file buffer to server disk
   */
  saveFileBuffer(file: { originalname: string; buffer: Buffer; mimetype: string }): { url: string } {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    const fullPath = join(this.uploadDir, filename);

    writeFileSync(fullPath, file.buffer);

    return {
      url: `/uploads/vehicles/${filename}`,
    };
  }
}
