import { Controller, Post, Get, Body, Res, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BackupService } from './backup.service';
import * as fs from 'fs';

@Controller('admin/backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  async createBackup(@Res() res: Response) {
    try {
      const result = await this.backupService.createBackup();
      const config = await this.backupService.getGoogleDriveConfig();

      return res.json({
        message: 'Backup criado com sucesso',
        fileName: result.fileName,
        size: result.size,
        googleDriveConfigured: this.backupService.isGoogleDriveConfigured(),
        folderId: config.folderId,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  @Post('create-and-upload')
  async createAndUpload(@Res() res: Response) {
    try {
      if (!this.backupService.isGoogleDriveConfigured()) {
        return res.status(400).json({
          message: 'Credenciais do Google Drive nao configuradas. Envie o JSON da Service Account primeiro.',
        });
      }

      const backup = await this.backupService.createBackup();
      const upload = await this.backupService.uploadToGoogleDrive(backup.filePath, backup.fileName);

      await this.backupService.deleteBackupFile(backup.fileName);

      return res.json({
        message: 'Backup criado e enviado ao Google Drive',
        fileName: backup.fileName,
        size: backup.size,
        driveFileId: upload.fileId,
        driveUrl: upload.fileUrl,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  @Get('history')
  async getHistory() {
    const history = await this.backupService.getBackupHistory();
    const config = await this.backupService.getGoogleDriveConfig();

    return {
      backups: history,
      googleDrive: {
        configured: this.backupService.isGoogleDriveConfigured(),
        folderId: config.folderId,
        serviceAccountEmail: config.serviceAccountEmail,
      },
    };
  }

  @Post('google-drive/connect')
  async connectGoogleDrive(@Body() body: { folderId?: string }) {
    try {
      if (!this.backupService.isGoogleDriveConfigured()) {
        return { connected: false, message: 'Service Account JSON nao encontrado no servidor' };
      }

      if (body.folderId) {
        await this.backupService.setGoogleDriveFolderId(body.folderId);
      }

      const config = await this.backupService.getGoogleDriveConfig();
      return {
        connected: true,
        folderId: config.folderId,
        serviceAccountEmail: config.serviceAccountEmail,
      };
    } catch (error) {
      return { connected: false, message: error.message };
    }
  }

  @Get('google-drive/folders')
  async listDriveFolders() {
    try {
      const folders = await this.backupService.listDriveFolders();
      return { folders };
    } catch (error) {
      return { folders: [], message: error.message };
    }
  }

  @Post('google-drive/create-folder')
  async createDriveFolder(@Body() body: { name: string }) {
    try {
      const folder = await this.backupService.createDriveFolder(body.name || 'My Love Delivery - Backups');
      await this.backupService.setGoogleDriveFolderId(folder.id);
      return { folder };
    } catch (error) {
      return { message: error.message };
    }
  }

  @Post('google-drive/upload-credentials')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCredentials(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        return { message: 'Nenhum arquivo enviado' };
      }

      const content = file.buffer.toString('utf-8');
      JSON.parse(content);

      await this.backupService.saveServiceAccountJson(content);

      return {
        message: 'Credenciais salvas com sucesso',
        serviceAccountEmail: JSON.parse(content).client_email,
      };
    } catch (error) {
      return { message: `Erro ao processar arquivo: ${error.message}` };
    }
  }
}
