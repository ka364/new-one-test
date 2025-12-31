/**
 * System Guardian Agent
 * 
 * An AI-powered agent that ensures each factory complies with state legislation
 * and adheres to ethical guidelines inspired by Al-Azhar principles, promoting
 * responsible and sustainable business practices.
 */

import { EventEmitter } from 'events';

// ==================== Types ====================

export interface FactoryCompliance {
  factoryId: string;
  legalCompliance: LegalComplianceStatus;
  ethicalCompliance: EthicalComplianceStatus;
  overallScore: number; // 0-100
  lastAuditDate: Date;
  nextAuditDate: Date;
}

export interface LegalComplianceStatus {
  licenses: LicenseStatus[];
  taxes: TaxComplianceStatus;
  laborLaw: LaborLawComplianceStatus;
  environmentalRegulations: EnvironmentalComplianceStatus;
  productSafety: ProductSafetyComplianceStatus;
  overallStatus: 'compliant' | 'warning' | 'non_compliant';
  issues: ComplianceIssue[];
}

export interface LicenseStatus {
  type: string;
  number: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'valid' | 'expiring_soon' | 'expired';
  renewalRequired: boolean;
  daysUntilExpiry?: number;
}

export interface TaxComplianceStatus {
  taxRegistrationNumber: string;
  lastFilingDate?: Date;
  nextFilingDate: Date;
  outstandingPayments: number;
  status: 'up_to_date' | 'due_soon' | 'overdue';
}

export interface LaborLawComplianceStatus {
  employeeContracts: {
    total: number;
    compliant: number;
    issues: string[];
  };
  workingHours: {
    compliant: boolean;
    violations: string[];
  };
  socialInsurance: {
    enrolled: number;
    pending: number;
    issues: string[];
  };
  status: 'compliant' | 'needs_attention' | 'non_compliant';
}

export interface EnvironmentalComplianceStatus {
  wasteManagement: boolean;
  emissionsControl: boolean;
  certifications: string[];
  status: 'compliant' | 'needs_improvement';
}

export interface ProductSafetyComplianceStatus {
  qualityStandards: string[];
  safetyTests: {
    required: string[];
    completed: string[];
  };
  recalls: number;
  status: 'compliant' | 'needs_attention';
}

export interface ComplianceIssue {
  id: string;
  category: 'legal' | 'ethical';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  detectedDate: Date;
  deadline?: Date;
  recommendations: string[];
  resolved: boolean;
}

export interface EthicalComplianceStatus {
  fairTrade: EthicalDimension;
  employeeWelfare: EthicalDimension;
  customerTreatment: EthicalDimension;
  supplierRelations: EthicalDimension;
  transparency: EthicalDimension;
  socialResponsibility: EthicalDimension;
  overallStatus: 'excellent' | 'good' | 'needs_improvement';
  issues: ComplianceIssue[];
}

export interface EthicalDimension {
  score: number; // 0-100
  principles: EthicalPrinciple[];
  violations: string[];
  recommendations: string[];
}

export interface EthicalPrinciple {
  name: string;
  description: string;
  source: 'al_azhar' | 'egyptian_values' | 'universal';
  adherence: boolean;
  notes?: string;
}

export interface GuardianAlert {
  id: string;
  factoryId: string;
  type: 'legal' | 'ethical';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  actionRequired: string;
  deadline?: Date;
  timestamp: Date;
  acknowledged: boolean;
}

// ==================== System Guardian Agent ====================

export class SystemGuardianAgent extends EventEmitter {
  private factoryCompliance: Map<string, FactoryCompliance> = new Map();
  private alerts: Map<string, GuardianAlert[]> = new Map();
  private ethicalPrinciples: EthicalPrinciple[] = [];
  
  constructor() {
    super();
    this.initializeEthicalPrinciples();
  }

  /**
   * Initialize ethical principles based on Al-Azhar guidelines and Egyptian values
   */
  private initializeEthicalPrinciples(): void {
    this.ethicalPrinciples = [
      {
        name: 'الأمانة والصدق',
        description: 'الصدق في التعامل مع العملاء والموظفين، وعدم الغش أو التدليس',
        source: 'al_azhar',
        adherence: true
      },
      {
        name: 'العدل في المعاملة',
        description: 'معاملة جميع الأطراف بعدل ومساواة دون تمييز',
        source: 'al_azhar',
        adherence: true
      },
      {
        name: 'حفظ الحقوق',
        description: 'احترام حقوق العاملين والعملاء والموردين',
        source: 'al_azhar',
        adherence: true
      },
      {
        name: 'الإتقان في العمل',
        description: 'السعي لتقديم أفضل جودة ممكنة في المنتجات والخدمات',
        source: 'al_azhar',
        adherence: true
      },
      {
        name: 'المسؤولية الاجتماعية',
        description: 'المساهمة في رفاهية المجتمع والحفاظ على البيئة',
        source: 'egyptian_values',
        adherence: true
      },
      {
        name: 'الشفافية',
        description: 'الوضوح والشفافية في جميع التعاملات',
        source: 'universal',
        adherence: true
      },
      {
        name: 'احترام الكرامة الإنسانية',
        description: 'معاملة جميع الأفراد باحترام وكرامة',
        source: 'al_azhar',
        adherence: true
      },
      {
        name: 'تجنب الضرر',
        description: 'عدم إلحاق الضرر بالآخرين أو بالبيئة',
        source: 'al_azhar',
        adherence: true
      }
    ];
  }

  /**
   * Register a factory with the System Guardian
   */
  async registerFactory(factoryId: string): Promise<void> {
    const compliance: FactoryCompliance = {
      factoryId,
      legalCompliance: await this.initializeLegalCompliance(factoryId),
      ethicalCompliance: await this.initializeEthicalCompliance(factoryId),
      overallScore: 0,
      lastAuditDate: new Date(),
      nextAuditDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    compliance.overallScore = this.calculateOverallScore(compliance);
    
    this.factoryCompliance.set(factoryId, compliance);
    this.alerts.set(factoryId, []);
    
    this.emit('factory:registered', { factoryId, compliance });
  }

  /**
   * Initialize legal compliance status
   */
  private async initializeLegalCompliance(factoryId: string): Promise<LegalComplianceStatus> {
    return {
      licenses: [],
      taxes: {
        taxRegistrationNumber: '',
        nextFilingDate: new Date(),
        outstandingPayments: 0,
        status: 'up_to_date'
      },
      laborLaw: {
        employeeContracts: {
          total: 0,
          compliant: 0,
          issues: []
        },
        workingHours: {
          compliant: true,
          violations: []
        },
        socialInsurance: {
          enrolled: 0,
          pending: 0,
          issues: []
        },
        status: 'compliant'
      },
      environmentalRegulations: {
        wasteManagement: true,
        emissionsControl: true,
        certifications: [],
        status: 'compliant'
      },
      productSafety: {
        qualityStandards: [],
        safetyTests: {
          required: [],
          completed: []
        },
        recalls: 0,
        status: 'compliant'
      },
      overallStatus: 'compliant',
      issues: []
    };
  }

  /**
   * Initialize ethical compliance status
   */
  private async initializeEthicalCompliance(factoryId: string): Promise<EthicalComplianceStatus> {
    return {
      fairTrade: {
        score: 85,
        principles: this.ethicalPrinciples.filter(p => p.name.includes('الأمانة') || p.name.includes('العدل')),
        violations: [],
        recommendations: []
      },
      employeeWelfare: {
        score: 80,
        principles: this.ethicalPrinciples.filter(p => p.name.includes('حفظ الحقوق') || p.name.includes('الكرامة')),
        violations: [],
        recommendations: []
      },
      customerTreatment: {
        score: 90,
        principles: this.ethicalPrinciples.filter(p => p.name.includes('الأمانة') || p.name.includes('الإتقان')),
        violations: [],
        recommendations: []
      },
      supplierRelations: {
        score: 85,
        principles: this.ethicalPrinciples.filter(p => p.name.includes('العدل') || p.name.includes('حفظ الحقوق')),
        violations: [],
        recommendations: []
      },
      transparency: {
        score: 88,
        principles: this.ethicalPrinciples.filter(p => p.name.includes('الشفافية')),
        violations: [],
        recommendations: []
      },
      socialResponsibility: {
        score: 75,
        principles: this.ethicalPrinciples.filter(p => p.name.includes('المسؤولية') || p.name.includes('الضرر')),
        violations: [],
        recommendations: ['زيادة المساهمة في المجتمع المحلي', 'تحسين إدارة النفايات']
      },
      overallStatus: 'good',
      issues: []
    };
  }

  /**
   * Monitor license expiry and send alerts
   */
  async monitorLicenses(factoryId: string): Promise<void> {
    const compliance = this.factoryCompliance.get(factoryId);
    if (!compliance) return;

    const today = new Date();
    
    compliance.legalCompliance.licenses.forEach(license => {
      const daysUntilExpiry = Math.floor(
        (license.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      license.daysUntilExpiry = daysUntilExpiry;
      
      if (daysUntilExpiry < 0) {
        license.status = 'expired';
        this.createAlert(factoryId, {
          type: 'legal',
          severity: 'critical',
          title: 'ترخيص منتهي الصلاحية',
          message: `الترخيص ${license.type} (${license.number}) منتهي الصلاحية`,
          actionRequired: 'يجب تجديد الترخيص فورًا لتجنب العقوبات القانونية',
          deadline: new Date()
        });
      } else if (daysUntilExpiry <= 30) {
        license.status = 'expiring_soon';
        license.renewalRequired = true;
        this.createAlert(factoryId, {
          type: 'legal',
          severity: 'high',
          title: 'تنبيه: ترخيص يقترب من الانتهاء',
          message: `الترخيص ${license.type} (${license.number}) سينتهي خلال ${daysUntilExpiry} يوم`,
          actionRequired: 'ابدأ إجراءات التجديد في أقرب وقت',
          deadline: license.expiryDate
        });
      } else {
        license.status = 'valid';
        license.renewalRequired = false;
      }
    });
    
    this.emit('licenses:monitored', { factoryId, licenses: compliance.legalCompliance.licenses });
  }

  /**
   * Monitor tax compliance
   */
  async monitorTaxes(factoryId: string): Promise<void> {
    const compliance = this.factoryCompliance.get(factoryId);
    if (!compliance) return;

    const today = new Date();
    const daysUntilFiling = Math.floor(
      (compliance.legalCompliance.taxes.nextFilingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilFiling < 0) {
      compliance.legalCompliance.taxes.status = 'overdue';
      this.createAlert(factoryId, {
        type: 'legal',
        severity: 'critical',
        title: 'تأخر في تقديم الإقرار الضريبي',
        message: 'الإقرار الضريبي متأخر، قد تتعرض لغرامات',
        actionRequired: 'قدم الإقرار الضريبي فورًا',
        deadline: new Date()
      });
    } else if (daysUntilFiling <= 7) {
      compliance.legalCompliance.taxes.status = 'due_soon';
      this.createAlert(factoryId, {
        type: 'legal',
        severity: 'high',
        title: 'تنبيه: موعد تقديم الإقرار الضريبي قريب',
        message: `يجب تقديم الإقرار الضريبي خلال ${daysUntilFiling} أيام`,
        actionRequired: 'جهز المستندات وقدم الإقرار',
        deadline: compliance.legalCompliance.taxes.nextFilingDate
      });
    } else {
      compliance.legalCompliance.taxes.status = 'up_to_date';
    }
    
    this.emit('taxes:monitored', { factoryId, status: compliance.legalCompliance.taxes });
  }

  /**
   * Audit ethical compliance
   */
  async auditEthicalCompliance(factoryId: string): Promise<EthicalComplianceStatus> {
    const compliance = this.factoryCompliance.get(factoryId);
    if (!compliance) throw new Error('Factory not registered');

    // In a real implementation, this would analyze:
    // - Customer complaints and feedback
    // - Employee satisfaction surveys
    // - Supplier payment records
    // - Product quality reports
    // - Social responsibility initiatives
    
    const ethical = compliance.ethicalCompliance;
    
    // Calculate overall ethical score
    const avgScore = (
      ethical.fairTrade.score +
      ethical.employeeWelfare.score +
      ethical.customerTreatment.score +
      ethical.supplierRelations.score +
      ethical.transparency.score +
      ethical.socialResponsibility.score
    ) / 6;
    
    if (avgScore >= 85) {
      ethical.overallStatus = 'excellent';
    } else if (avgScore >= 70) {
      ethical.overallStatus = 'good';
    } else {
      ethical.overallStatus = 'needs_improvement';
      this.createAlert(factoryId, {
        type: 'ethical',
        severity: 'medium',
        title: 'تحسين الامتثال الأخلاقي مطلوب',
        message: 'بعض جوانب الامتثال الأخلاقي تحتاج إلى تحسين',
        actionRequired: 'راجع التوصيات واتخذ الإجراءات اللازمة'
      });
    }
    
    this.emit('ethical:audited', { factoryId, status: ethical });
    
    return ethical;
  }

  /**
   * Create an alert
   */
  private createAlert(
    factoryId: string,
    alert: Omit<GuardianAlert, 'id' | 'factoryId' | 'timestamp' | 'acknowledged'>
  ): void {
    const fullAlert: GuardianAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      factoryId,
      timestamp: new Date(),
      acknowledged: false
    };
    
    const alerts = this.alerts.get(factoryId) || [];
    alerts.push(fullAlert);
    this.alerts.set(factoryId, alerts);
    
    this.emit('alert:created', fullAlert);
  }

  /**
   * Get all alerts for a factory
   */
  getAlerts(factoryId: string, unacknowledgedOnly: boolean = false): GuardianAlert[] {
    const alerts = this.alerts.get(factoryId) || [];
    
    if (unacknowledgedOnly) {
      return alerts.filter(a => !a.acknowledged);
    }
    
    return alerts;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(factoryId: string, alertId: string): void {
    const alerts = this.alerts.get(factoryId) || [];
    const alert = alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert:acknowledged', alert);
    }
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallScore(compliance: FactoryCompliance): number {
    // Legal compliance weight: 60%
    let legalScore = 100;
    
    if (compliance.legalCompliance.overallStatus === 'non_compliant') {
      legalScore = 40;
    } else if (compliance.legalCompliance.overallStatus === 'warning') {
      legalScore = 70;
    }
    
    // Ethical compliance weight: 40%
    const ethicalScores = [
      compliance.ethicalCompliance.fairTrade.score,
      compliance.ethicalCompliance.employeeWelfare.score,
      compliance.ethicalCompliance.customerTreatment.score,
      compliance.ethicalCompliance.supplierRelations.score,
      compliance.ethicalCompliance.transparency.score,
      compliance.ethicalCompliance.socialResponsibility.score
    ];
    
    const ethicalScore = ethicalScores.reduce((a, b) => a + b, 0) / ethicalScores.length;
    
    return Math.round(legalScore * 0.6 + ethicalScore * 0.4);
  }

  /**
   * Get compliance report
   */
  getComplianceReport(factoryId: string): FactoryCompliance | null {
    return this.factoryCompliance.get(factoryId) || null;
  }

  /**
   * Perform comprehensive audit
   */
  async performComprehensiveAudit(factoryId: string): Promise<FactoryCompliance> {
    await this.monitorLicenses(factoryId);
    await this.monitorTaxes(factoryId);
    await this.auditEthicalCompliance(factoryId);
    
    const compliance = this.factoryCompliance.get(factoryId);
    if (!compliance) throw new Error('Factory not registered');
    
    compliance.overallScore = this.calculateOverallScore(compliance);
    compliance.lastAuditDate = new Date();
    compliance.nextAuditDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    this.emit('audit:completed', { factoryId, compliance });
    
    return compliance;
  }
}

// ==================== Singleton Instance ====================

export const systemGuardian = new SystemGuardianAgent();
