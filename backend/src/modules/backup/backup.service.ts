import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = '/tmp/backups';
  private readonly credentialsPath = '/app/config/google-service-account.json';

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup(): Promise<{ filePath: string; fileName: string; size: number }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backup_${timestamp}.sql`;
    const filePath = path.join(this.backupDir, fileName);

    this.logger.log(`Iniciando backup: ${fileName}`);

    try {
      const dump = execSync(
        'docker exec cardapio-postgres pg_dump -U cardapio -d cardapio --no-owner --no-acl',
        { encoding: 'utf-8', timeout: 120000 },
      );
      fs.writeFileSync(filePath, dump);
    } catch (error) {
      this.logger.error(`Erro ao criar backup: ${error.message}`);
      throw new Error(`Falha ao criar backup: ${error.message}`);
    }

    const stats = fs.statSync(filePath);
    this.logger.log(`Backup criado: ${fileName} (${(stats.size / 1024).toFixed(1)}KB)`);
    return { filePath, fileName, size: stats.size };
  }

  async getGoogleDriveConfig() {
    const config = await this.prisma.configSistema.findFirst();
    return {
      folderId: (config as any)?.googleDriveFolderId || null,
      serviceAccountEmail: (config as any)?.googleServiceAccountEmail || null,
    };
  }

  private getDriveClient() {
    if (!fs.existsSync(this.credentialsPath)) {
      throw new Error(
        'Arquivo de credenciais do Google nao encontrado. ' +
        'Envie o JSON da Service Account para /app/config/google-service-account.json',
      );
    }

    const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf-8'));
    const { google } = require('googleapis');

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    return { google, auth, serviceAccountEmail: credentials.client_email };
  }

  async listDriveFolders(): Promise<{ id: string; name: string }[]> {
    const { google, auth } = this.getDriveClient();
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      pageSize: 100,
    });

    return res.data.files || [];
  }

  async createDriveFolder(name: string): Promise<{ id: string; name: string }> {
    const { google, auth } = this.getDriveClient();
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id, name',
    });

    return res.data;
  }

  async uploadToGoogleDrive(filePath: string, fileName: string): Promise<{ fileId: string; fileUrl: string }> {
    const { google, auth, serviceAccountEmail } = this.getDriveClient();
    const drive = google.drive({ version: 'v3', auth });
    const config = await this.getGoogleDriveConfig();

    let folderId = config.folderId;

    if (!folderId) {
      const folder = await this.createDriveFolder('My Love Delivery - Backups');
      folderId = folder.id;

      await this.prisma.configSistema.updateMany({
        data: { googleDriveFolderId: folderId } as any,
      });

      this.logger.log(`Pasta criada no Google Drive: ${folderId}`);
    }

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: 'application/sql',
      body: fs.createReadStream(filePath),
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink',
    });

    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: serviceAccountEmail,
      },
    });

    this.logger.log(`Arquivo enviado ao Google Drive: ${res.data.id}`);

    return {
      fileId: res.data.id,
      fileUrl: res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`,
    };
  }

  async getBackupHistory(): Promise<any[]> {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
        .map(f => {
          const stats = fs.statSync(path.join(this.backupDir, f));
          return {
            fileName: f,
            size: stats.size,
            createdAt: stats.birthtime,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 20);

      return files;
    } catch {
      return [];
    }
  }

  async deleteBackupFile(fileName: string): Promise<void> {
    const filePath = path.join(this.backupDir, fileName);
    if (fs.existsSync(filePath) && fileName.startsWith('backup_') && fileName.endsWith('.sql')) {
      fs.unlinkSync(filePath);
    }
  }

  async setGoogleDriveFolderId(folderId: string): Promise<void> {
    await this.prisma.configSistema.updateMany({
      data: { googleDriveFolderId: folderId } as any,
    });
  }

  async saveServiceAccountJson(jsonContent: string): Promise<void> {
    const configDir = path.dirname(this.credentialsPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(this.credentialsPath, jsonContent, 'utf-8');

    const parsed = JSON.parse(jsonContent);
    if (parsed.client_email) {
      await this.prisma.configSistema.updateMany({
        data: { googleServiceAccountEmail: parsed.client_email } as any,
      });
    }
  }

  isGoogleDriveConfigured(): boolean {
    return fs.existsSync(this.credentialsPath);
  }
}
