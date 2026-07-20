import { Injectable } from '@nestjs/common';
import { execSync } from 'child_process';
import * as os from 'os';

@Injectable()
export class ServerStatusService {
  getInfo() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const uptime = os.uptime();

    let diskInfo: any = {};
    try {
      const df = execSync('df -h / 2>/dev/null | tail -1', { encoding: 'utf-8' }).trim();
      const parts = df.split(/\s+/);
      diskInfo = {
        total: parts[1] || 'N/A',
        used: parts[2] || 'N/A',
        available: parts[3] || 'N/A',
        percent: parts[4] || 'N/A',
      };
    } catch {
      diskInfo = { total: 'N/A', used: 'N/A', available: 'N/A', percent: 'N/A' };
    }

    let dockerInfo: any[] = [];
    try {
      const ps = execSync(
        'docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}" 2>/dev/null',
        { encoding: 'utf-8' },
      ).trim();
      dockerInfo = ps.split('\n').filter(Boolean).map((line) => {
        const [name, status, ports] = line.split('|');
        return { name, status, ports };
      });
    } catch {
      dockerInfo = [];
    }

    let nodeVersion = 'N/A';
    try {
      nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
    } catch {}

    let postgresVersion = 'N/A';
    try {
      postgresVersion = execSync(
        "docker exec cardapio-postgres psql -U cardapio -d cardapio -t -A -c 'SELECT version()'",
        { encoding: 'utf-8' },
      ).trim();
    } catch {}

    let redisStatus = 'Indisponivel';
    try {
      const redisPong = execSync(
        'docker exec cardapio-redis redis-cli ping 2>/dev/null',
        { encoding: 'utf-8' },
      ).trim();
      redisStatus = redisPong === 'PONG' ? 'Conectado' : 'Erro';
    } catch {}

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      cpu: {
        model: cpus[0]?.model || 'N/A',
        cores: cpus.length,
        usage: this.getCpuUsage(),
      },
      memory: {
        total: this.formatBytes(totalMem),
        free: this.formatBytes(freeMem),
        used: this.formatBytes(totalMem - freeMem),
        percent: Math.round(((totalMem - freeMem) / totalMem) * 100),
      },
      disk: diskInfo,
      nodeVersion,
      postgresVersion,
      redisStatus,
      dockerContainers: dockerInfo,
      loadAvg: os.loadavg().map((l) => l.toFixed(2)),
    };
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  private formatBytes(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  }

  private getCpuUsage(): number {
    const loadAvg = os.loadavg();
    const cores = os.cpus().length;
    return Math.min(100, Math.round((loadAvg[0] / cores) * 100));
  }
}
