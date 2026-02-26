import AuditLogModel from '../modules/audit/auditLog.model.ts';

interface AuditEntry {
  userId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, any>;
  ip?: string;
}

/**
 * Append an audit log entry. Fire-and-forget — never throws.
 */
export function logAudit(entry: AuditEntry): void {
  AuditLogModel.create(entry).catch(() => {});
}
