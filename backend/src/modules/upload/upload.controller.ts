import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface MulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('base64')
  uploadBase64(@Body('image') image: string) {
    if (!image) {
      throw new BadRequestException('Image string is required');
    }
    return this.uploadService.saveBase64Image(image);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadBinary(@UploadedFile() file?: MulterFile) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.uploadService.saveFileBuffer(file);
  }
}
