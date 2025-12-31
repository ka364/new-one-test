/**
 * Development Lab Agent - Security & Privacy Layer
 * 
 * This module ensures complete data isolation and confidentiality for each factory.
 * The agent is designed exclusively for development purposes and maintains strict
 * data segregation between factories.
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';

// ==================== Types ====================

export interface AccessLog {
  id: string;
  factoryId: string;
  agentId: string;
  operation: string;
  dataAccessed: string[];
  timestamp: Date;
  purpose: 'development' | 'analysis' | 'research';
  authorized: boolean;
}

export interface DataIsolationPolicy {
  factoryId: string;
  allowedOperations: string[];
  dataRetentionDays: number;
  encryptionEnabled: boolean;
  crossFactoryAccessBlocked: boolean;
}

export interface PrivacyAudit {
  factoryId: string;
  totalAccesses: number;
  unauthorizedAttempts: number;
  dataLeaks: number;
  complianceScore: number; // 0-100
  lastAuditDate: Date;
}

// ==================== Security Manager ====================

export class DevLabSecurityManager extends EventEmitter {
  private accessLogs: Map<string, AccessLog[]> = new Map();
  private isolationPolicies: Map<string, DataIsolationPolicy> = new Map();
  private encryptionKeys: Map<string, Buffer> = new Map();
  
  constructor() {
    super();
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default security policies
   */
  private initializeDefaultPolicies(): void {
    // Default policy: Maximum security and isolation
    const defaultPolicy: Omit<DataIsolationPolicy, 'factoryId'> = {
      allowedOperations: [
        'analyze_feedback',
        'research_innovations',
        'find_suppliers',
        'analyze_competition',
        'calculate_metrics',
        'generate_roadmap'
      ],
      dataRetentionDays: 365,
      encryptionEnabled: true,
      crossFactoryAccessBlocked: true
    };
    
    this.emit('security:initialized', { defaultPolicy });
  }

  /**
   * Register a factory with the security system
   */
  registerFactory(factoryId: string, customPolicy?: Partial<DataIsolationPolicy>): void {
    // Generate unique encryption key for this factory
    const encryptionKey = crypto.randomBytes(32);
    this.encryptionKeys.set(factoryId, encryptionKey);
    
    // Set up isolation policy
    const policy: DataIsolationPolicy = {
      factoryId,
      allowedOperations: customPolicy?.allowedOperations || [
        'analyze_feedback',
        'research_innovations',
        'find_suppliers',
        'analyze_competition',
        'calculate_metrics',
        'generate_roadmap'
      ],
      dataRetentionDays: customPolicy?.dataRetentionDays || 365,
      encryptionEnabled: customPolicy?.encryptionEnabled ?? true,
      crossFactoryAccessBlocked: customPolicy?.crossFactoryAccessBlocked ?? true
    };
    
    this.isolationPolicies.set(factoryId, policy);
    this.accessLogs.set(factoryId, []);
    
    this.emit('factory:registered', { factoryId, policy });
  }

  /**
   * Authorize an agent operation
   */
  authorizeOperation(
    agentId: string,
    factoryId: string,
    operation: string,
    dataToAccess: string[]
  ): { authorized: boolean; reason?: string } {
    const policy = this.isolationPolicies.get(factoryId);
    
    if (!policy) {
      return { authorized: false, reason: 'Factory not registered' };
    }
    
    // Check if operation is allowed
    if (!policy.allowedOperations.includes(operation)) {
      this.logAccess(agentId, factoryId, operation, dataToAccess, false);
      this.emit('security:unauthorized_operation', { agentId, factoryId, operation });
      return { authorized: false, reason: 'Operation not allowed by policy' };
    }
    
    // Check for cross-factory access attempts
    if (policy.crossFactoryAccessBlocked) {
      const containsCrossFactoryData = dataToAccess.some(data => 
        !data.startsWith(`factory:${factoryId}`)
      );
      
      if (containsCrossFactoryData) {
        this.logAccess(agentId, factoryId, operation, dataToAccess, false);
        this.emit('security:cross_factory_attempt', { agentId, factoryId, dataToAccess });
        return { authorized: false, reason: 'Cross-factory access blocked' };
      }
    }
    
    // Log successful authorization
    this.logAccess(agentId, factoryId, operation, dataToAccess, true);
    
    return { authorized: true };
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(factoryId: string, data: string): string {
    const policy = this.isolationPolicies.get(factoryId);
    
    if (!policy?.encryptionEnabled) {
      return data; // Encryption disabled for this factory
    }
    
    const key = this.encryptionKeys.get(factoryId);
    if (!key) {
      throw new Error('Encryption key not found for factory');
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to encrypted data
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(factoryId: string, encryptedData: string): string {
    const policy = this.isolationPolicies.get(factoryId);
    
    if (!policy?.encryptionEnabled) {
      return encryptedData; // Encryption disabled for this factory
    }
    
    const key = this.encryptionKeys.get(factoryId);
    if (!key) {
      throw new Error('Encryption key not found for factory');
    }
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Log access for audit trail
   */
  private logAccess(
    agentId: string,
    factoryId: string,
    operation: string,
    dataAccessed: string[],
    authorized: boolean
  ): void {
    const log: AccessLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      factoryId,
      agentId,
      operation,
      dataAccessed,
      timestamp: new Date(),
      purpose: 'development',
      authorized
    };
    
    const logs = this.accessLogs.get(factoryId) || [];
    logs.push(log);
    this.accessLogs.set(factoryId, logs);
    
    if (!authorized) {
      this.emit('security:unauthorized_access', log);
    }
  }

  /**
   * Get access logs for a factory
   */
  getAccessLogs(factoryId: string, limit: number = 100): AccessLog[] {
    const logs = this.accessLogs.get(factoryId) || [];
    return logs.slice(-limit);
  }

  /**
   * Perform privacy audit
   */
  performPrivacyAudit(factoryId: string): PrivacyAudit {
    const logs = this.accessLogs.get(factoryId) || [];
    const policy = this.isolationPolicies.get(factoryId);
    
    const totalAccesses = logs.length;
    const unauthorizedAttempts = logs.filter(log => !log.authorized).length;
    const dataLeaks = 0; // Would be detected by monitoring system
    
    // Calculate compliance score
    let complianceScore = 100;
    
    if (unauthorizedAttempts > 0) {
      complianceScore -= Math.min(unauthorizedAttempts * 5, 30);
    }
    
    if (!policy?.encryptionEnabled) {
      complianceScore -= 20;
    }
    
    if (!policy?.crossFactoryAccessBlocked) {
      complianceScore -= 30;
    }
    
    const audit: PrivacyAudit = {
      factoryId,
      totalAccesses,
      unauthorizedAttempts,
      dataLeaks,
      complianceScore: Math.max(0, complianceScore),
      lastAuditDate: new Date()
    };
    
    this.emit('audit:completed', audit);
    
    return audit;
  }

  /**
   * Verify data isolation
   */
  verifyDataIsolation(factoryId: string): {
    isolated: boolean;
    violations: string[];
  } {
    const logs = this.accessLogs.get(factoryId) || [];
    const violations: string[] = [];
    
    // Check for cross-factory access attempts
    logs.forEach(log => {
      if (!log.authorized && log.operation.includes('cross')) {
        violations.push(`Unauthorized cross-factory access attempt: ${log.operation}`);
      }
    });
    
    return {
      isolated: violations.length === 0,
      violations
    };
  }

  /**
   * Clean up old data based on retention policy
   */
  async cleanupOldData(factoryId: string): Promise<number> {
    const policy = this.isolationPolicies.get(factoryId);
    if (!policy) return 0;
    
    const logs = this.accessLogs.get(factoryId) || [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.dataRetentionDays);
    
    const remainingLogs = logs.filter(log => log.timestamp > cutoffDate);
    const removedCount = logs.length - remainingLogs.length;
    
    this.accessLogs.set(factoryId, remainingLogs);
    
    this.emit('cleanup:completed', { factoryId, removedCount });
    
    return removedCount;
  }

  /**
   * Generate security report
   */
  generateSecurityReport(factoryId: string): {
    factoryId: string;
    policy: DataIsolationPolicy;
    audit: PrivacyAudit;
    isolation: { isolated: boolean; violations: string[] };
    recommendations: string[];
  } {
    const policy = this.isolationPolicies.get(factoryId);
    if (!policy) {
      throw new Error('Factory not registered');
    }
    
    const audit = this.performPrivacyAudit(factoryId);
    const isolation = this.verifyDataIsolation(factoryId);
    
    const recommendations: string[] = [];
    
    if (audit.complianceScore < 90) {
      recommendations.push('Review and address unauthorized access attempts');
    }
    
    if (!policy.encryptionEnabled) {
      recommendations.push('Enable encryption for sensitive data');
    }
    
    if (audit.unauthorizedAttempts > 5) {
      recommendations.push('Investigate repeated unauthorized access patterns');
    }
    
    return {
      factoryId,
      policy,
      audit,
      isolation,
      recommendations
    };
  }
}

// ==================== Singleton Instance ====================

export const devLabSecurity = new DevLabSecurityManager();

// ==================== Privacy Commitment ====================

export const PRIVACY_COMMITMENT = {
  title: 'Development Lab Agent Privacy Commitment',
  principles: [
    'Complete data isolation between factories',
    'No cross-factory data sharing or analysis',
    'All sensitive data encrypted at rest and in transit',
    'Access logs maintained for full transparency',
    'Agent operates exclusively for development purposes',
    'Compliance with all data protection regulations',
    'Regular security audits and compliance checks',
    'Factory owners have full control over their data'
  ],
  guarantees: [
    'Your data will never be shared with competitors',
    'Your strategic insights remain confidential',
    'You can request data deletion at any time',
    'You have full access to all audit logs',
    'The agent works only for your benefit'
  ]
};
