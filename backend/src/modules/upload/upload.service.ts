import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = path.resolve(__dirname, '..', '..', '..', 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadImagem(file: Express.Multer.File, subfolder = 'geral'): Promise<string> {
    const folder = path.join(this.uploadDir, subfolder);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const filepath = path.join(folder, filename);

    try {
      if (file.mimetype?.startsWith('image/')) {
        await sharp(file.buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(filepath);
      } else {
        fs.writeFileSync(filepath, file.buffer);
      }

      return `/uploads/${subfolder}/${filename}`;
    } catch (error) {
      fs.writeFileSync(filepath, file.buffer);
      return `/uploads/${subfolder}/${filename}`;
    }
  }

  async deleteImagem(url: string) {
    if (!url) return;
    const relativePath = url.replace(/^https?:\/\/[^\/]+/, '');
    const segments = relativePath.split('/').filter(Boolean);
    const filepath = path.join(this.uploadDir, ...segments.slice(1));
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}
