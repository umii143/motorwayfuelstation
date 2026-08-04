export interface AIAuditRecord {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  prompt: string;
  collectionsChecked: string[];
  provider: string;
  model: string;
  latencyMs: number;
  tokens: number;
  confidence: number;
  responseHash: string;
  status: 'APPROVED' | 'REJECTED' | 'SAFE_MODE';
  rejectionReason?: string;
}

export interface AIHealthMetrics {
  groqStatus: 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED';
  geminiStatus: 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED';
  offlineEngineStatus: 'ONLINE';
  avgLatencyMs: number;
  totalRequestsToday: number;
  lastFailureTime: string | null;
}

const AUDIT_LOG_KEY = 'fuelpro_ai_audit_logs';

export class AIAuditLogger {
  static logRequest(record: Omit<AIAuditRecord, 'id' | 'timestamp'>): AIAuditRecord {
    const fullRecord: AIAuditRecord = {
      ...record,
      id: `AI-LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    try {
      const existingRaw = localStorage.getItem(AUDIT_LOG_KEY);
      const logs: AIAuditRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
      logs.unshift(fullRecord);
      // Keep last 500 records
      if (logs.length > 500) logs.pop();
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('[AIAuditLogger] Failed to write audit log:', e);
    }

    return fullRecord;
  }

  static getLogs(): AIAuditRecord[] {
    try {
      const existingRaw = localStorage.getItem(AUDIT_LOG_KEY);
      return existingRaw ? JSON.parse(existingRaw) : [];
    } catch {
      return [];
    }
  }

  static getHealthMetrics(): AIHealthMetrics {
    const logs = this.getLogs();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.timestamp.startsWith(todayStr));

    const totalLatency = todayLogs.reduce((sum, l) => sum + (l.latencyMs || 0), 0);
    const avgLatencyMs = todayLogs.length > 0 ? Math.round(totalLatency / todayLogs.length) : 0;
    const lastFailure = logs.find(l => l.status === 'REJECTED');

    return {
      groqStatus: 'ONLINE',
      geminiStatus: 'ONLINE',
      offlineEngineStatus: 'ONLINE',
      avgLatencyMs,
      totalRequestsToday: todayLogs.length,
      lastFailureTime: lastFailure ? lastFailure.timestamp : null,
    };
  }
}
