import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

@Injectable()
export class ConfigService {
  private readonly envConfig: Record<string, string>;

  constructor() {
    // In development ts-node runs from src/, in production from dist/
    // Try multiple paths to ensure .env is always found
    const candidates = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(__dirname, '../../.env'),
      path.resolve(__dirname, '../../../.env'),
    ];

    for (const envPath of candidates) {
      const result = dotenv.config({ path: envPath });
      if (!result.error) break;
    }

    this.envConfig = process.env as Record<string, string>;
  }

  get(key: string, defaultValue?: string): string {
    return this.envConfig[key] || defaultValue || '';
  }

  getNumber(key: string, defaultValue?: number): number {
    const value = this.envConfig[key];
    return value ? Number(value) : defaultValue || 0;
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.envConfig[key];
    if (value === undefined) return defaultValue || false;
    return value.toLowerCase() === 'true' || value === '1';
  }

  get jwtSecret(): string {
    return this.get('JWT_SECRET', 'super-secret-key');
  }

  get jwtRefreshSecret(): string {
    return this.get('JWT_REFRESH_SECRET', 'super-refresh-secret');
  }

  get jwtExpiration(): string {
    return this.get('JWT_EXPIRATION', '15m');
  }

  get jwtRefreshExpiration(): string {
    return this.get('JWT_REFRESH_EXPIRATION', '7d');
  }

  get databaseUrl(): string {
    return this.get('DATABASE_URL', 'postgresql://cardapio:cardapio123@localhost:5432/cardapio');
  }

  get frontendUrl(): string {
    return this.get('FRONTEND_URL', 'http://localhost:3000');
  }

  get uazapiUrl(): string {
    return this.get('UAZAPI_URL', '');
  }

  get uazapiAdminToken(): string {
    return this.get('UAZAPI_ADMIN_TOKEN', '');
  }

  get whatsappApiUrl(): string {
    return this.get('WHATSAPP_API_URL', 'http://localhost:8080');
  }

  get whatsappApiKey(): string {
    return this.get('WHATSAPP_API_KEY', '');
  }

  get openaiApiKey(): string {
    return this.get('OPENAI_API_KEY', '');
  }

  get mercadoPagoAccessToken(): string {
    return this.get('MERCADO_PAGO_ACCESS_TOKEN', '');
  }

  get mercadoPagoPublicKey(): string {
    return this.get('MERCADO_PAGO_PUBLIC_KEY', '');
  }

  get uploadDir(): string {
    return this.get('UPLOAD_DIR', './uploads');
  }

  get maxFileSize(): number {
    return this.getNumber('MAX_FILE_SIZE', 5242880);
  }
}
