import { Controller, Post, UseInterceptors, UploadedFile, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private uploadService: UploadService) {}

  private fullUrl(path: string, req: Request): string {
    const base = `${req.protocol}://${req.get('host')}`;
    return `${base}${path}`;
  }

  @Post('imagem')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImagem(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('Arquivo nao enviado');
    const path = await this.uploadService.uploadImagem(file, 'imagens');
    return { url: this.fullUrl(path, req) };
  }

  @Post('produto')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProduto(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('Arquivo nao enviado');
    const path = await this.uploadService.uploadImagem(file, 'produtos');
    return { url: this.fullUrl(path, req) };
  }

  @Post('logo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('Arquivo nao enviado');
    const path = await this.uploadService.uploadImagem(file, 'logos');
    return { url: this.fullUrl(path, req) };
  }

  @Post('banner')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBanner(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('Arquivo nao enviado');
    const path = await this.uploadService.uploadImagem(file, 'banners');
    return { url: this.fullUrl(path, req) };
  }

  @Post('chat')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadChatMedia(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('Arquivo nao enviado');
    const isAudio = file.mimetype?.startsWith('audio/');
    const folder = isAudio ? 'audios' : 'chat-imagens';
    const path = await this.uploadService.uploadImagem(file, folder);
    return { url: this.fullUrl(path, req), tipo: isAudio ? 'audio' : 'image' };
  }
}
