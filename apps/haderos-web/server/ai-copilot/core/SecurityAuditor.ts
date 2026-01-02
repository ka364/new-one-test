/**
 * 🔒 SECURITY AUDITOR
 *
 * مدقق الأمان الذكي - يفحص الثغرات الأمنية
 */

import { glob } from 'glob';
import { readFile } from 'fs/promises';
import path from 'path';

export interface SecurityAnalysis {
  score: number;
  vulnerabilities: SecurityVulnerability[];
  recommendations: SecurityRecommendation[];
  criticalIssues: any[];
}

export interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  file: string;
  line?: number;
  cwe?: string; // Common Weakness Enumeration
  fix: string;
}

export interface SecurityRecommendation {
  priority: number;
  title: string;
  description: string;
  implementation: string;
}

export class SecurityAuditor {
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * مراجعة أمنية شاملة
   */
  async auditSecurity(): Promise<SecurityAnalysis> {
    console.log('🔒 Running security audit...');

    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for common security issues
    await this.checkSQLInjection(vulnerabilities);
    await this.checkXSS(vulnerabilities);
    await this.checkSecrets(vulnerabilities);
    await this.checkDependencies(vulnerabilities);
    await this.checkAuthentication(vulnerabilities);
    await this.checkCORS(vulnerabilities);

    const score = this.calculateSecurityScore(vulnerabilities);
    const recommendations = this.generateSecurityRecommendations(vulnerabilities);

    return {
      score,
      vulnerabilities: vulnerabilities.slice(0, 50),
      recommendations,
      criticalIssues: vulnerabilities.filter((v) => v.severity === 'critical'),
    };
  }

  /**
   * فحص SQL Injection
   */
  private async checkSQLInjection(vulnerabilities: SecurityVulnerability[]): Promise<void> {
    const files = await glob('**/*.{ts,js}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**'],
    });

    for (const file of files.slice(0, 100)) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Dangerous patterns
          if (line.includes('db.query(') && line.includes('${')) {
            vulnerabilities.push({
              id: `sql-injection-${file}-${i}`,
              severity: 'critical',
              category: 'sql_injection',
              title: 'Potential SQL Injection',
              description: 'String interpolation in SQL query',
              file,
              line: i + 1,
              cwe: 'CWE-89',
              fix: 'Use parameterized queries or ORM',
            });
          }

          if (line.includes('.raw(') && line.includes('${')) {
            vulnerabilities.push({
              id: `raw-sql-${file}-${i}`,
              severity: 'high',
              category: 'sql_injection',
              title: 'Raw SQL with interpolation',
              description: 'Using raw SQL with string interpolation',
              file,
              line: i + 1,
              cwe: 'CWE-89',
              fix: 'Use ORM methods or parameterized queries',
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  /**
   * فحص XSS
   */
  private async checkXSS(vulnerabilities: SecurityVulnerability[]): Promise<void> {
    const files = await glob('**/*.{tsx,jsx}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**'],
    });

    for (const file of files.slice(0, 100)) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          if (line.includes('dangerouslySetInnerHTML')) {
            vulnerabilities.push({
              id: `xss-${file}-${i}`,
              severity: 'high',
              category: 'xss',
              title: 'Potential XSS vulnerability',
              description: 'Using dangerouslySetInnerHTML',
              file,
              line: i + 1,
              cwe: 'CWE-79',
              fix: 'Sanitize HTML content or use safe rendering methods',
            });
          }

          if (line.includes('eval(') || line.includes('Function(')) {
            vulnerabilities.push({
              id: `eval-${file}-${i}`,
              severity: 'critical',
              category: 'code_injection',
              title: 'Code injection risk',
              description: 'Using eval() or Function()',
              file,
              line: i + 1,
              cwe: 'CWE-95',
              fix: 'Remove eval() - use safer alternatives',
            });
          }
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * فحص الأسرار المكشوفة
   */
  private async checkSecrets(vulnerabilities: SecurityVulnerability[]): Promise<void> {
    const files = await glob('**/*.{ts,js,env,json}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**', 'dist/**'],
    });

    const secretPatterns = [
      { pattern: /api[_-]?key/i, name: 'API Key' },
      { pattern: /secret/i, name: 'Secret' },
      { pattern: /password\s*=\s*['"][^'"]+['"]/i, name: 'Hardcoded Password' },
      { pattern: /bearer\s+[a-zA-Z0-9_-]+/i, name: 'Bearer Token' },
      { pattern: /-----BEGIN.*PRIVATE KEY-----/, name: 'Private Key' },
    ];

    for (const file of files.slice(0, 100)) {
      // Skip .env.example files
      if (file.includes('.example') || file.includes('.sample')) continue;

      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          for (const { pattern, name } of secretPatterns) {
            if (pattern.test(line) && !line.includes('process.env')) {
              vulnerabilities.push({
                id: `secret-${file}-${i}`,
                severity: 'critical',
                category: 'exposed_secrets',
                title: `${name} exposed`,
                description: `Potential ${name} found in code`,
                file,
                line: i + 1,
                cwe: 'CWE-798',
                fix: 'Move to environment variables',
              });
            }
          }
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * فحص التبعيات
   */
  private async checkDependencies(vulnerabilities: SecurityVulnerability[]): Promise<void> {
    try {
      const packageJson = await readFile(path.join(this.projectRoot, 'package.json'), 'utf-8');
      const pkg = JSON.parse(packageJson);

      // Check for known vulnerable packages (simplified)
      const vulnerablePackages = ['node-sass', 'request', 'ua-parser-js'];

      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      for (const [name, version] of Object.entries(allDeps)) {
        if (vulnerablePackages.includes(name)) {
          vulnerabilities.push({
            id: `dep-${name}`,
            severity: 'high',
            category: 'vulnerable_dependency',
            title: 'Vulnerable dependency',
            description: `Package ${name} has known vulnerabilities`,
            file: 'package.json',
            cwe: 'CWE-1104',
            fix: `Update or replace ${name}`,
          });
        }
      }
    } catch (error) {
      // No package.json found
    }
  }

  /**
   * فحص المصادقة
   */
  private async checkAuthentication(vulnerabilities: SecurityVulnerability[]): Promise<void> {
    const files = await glob('**/auth*.{ts,js}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**'],
    });

    for (const file of files) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');

        if (!content.includes('bcrypt') && !content.includes('argon2')) {
          vulnerabilities.push({
            id: `weak-hash-${file}`,
            severity: 'high',
            category: 'weak_crypto',
            title: 'Weak password hashing',
            description: 'Not using bcrypt or argon2',
            file,
            cwe: 'CWE-326',
            fix: 'Use bcrypt or argon2 for password hashing',
          });
        }

        if (content.includes('md5') || content.includes('sha1')) {
          vulnerabilities.push({
            id: `weak-algo-${file}`,
            severity: 'critical',
            category: 'weak_crypto',
            title: 'Weak cryptographic algorithm',
            description: 'Using MD5 or SHA1',
            file,
            cwe: 'CWE-327',
            fix: 'Use SHA-256 or better',
          });
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * فحص CORS
   */
  private async checkCORS(vulnerabilities: SecurityVulnerability[]): Promise<void> {
    const files = await glob('**/server*.{ts,js}', {
      cwd: this.projectRoot,
      ignore: ['node_modules/**'],
    });

    for (const file of files) {
      try {
        const content = await readFile(path.join(this.projectRoot, file), 'utf-8');

        if (content.includes("origin: '*'") || content.includes('origin:"*"')) {
          vulnerabilities.push({
            id: `cors-${file}`,
            severity: 'medium',
            category: 'cors_misconfiguration',
            title: 'Permissive CORS policy',
            description: 'CORS allows all origins',
            file,
            cwe: 'CWE-942',
            fix: 'Restrict CORS to specific origins',
          });
        }
      } catch (error) {
        // Skip
      }
    }
  }

  /**
   * حساب درجة الأمان
   */
  private calculateSecurityScore(vulnerabilities: SecurityVulnerability[]): number {
    let score = 100;

    for (const vuln of vulnerabilities) {
      if (vuln.severity === 'critical') score -= 15;
      else if (vuln.severity === 'high') score -= 10;
      else if (vuln.severity === 'medium') score -= 5;
      else score -= 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * توليد توصيات أمنية
   */
  private generateSecurityRecommendations(
    vulnerabilities: SecurityVulnerability[]
  ): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];

    const categories = new Set(vulnerabilities.map((v) => v.category));

    if (categories.has('sql_injection')) {
      recommendations.push({
        priority: 100,
        title: 'Prevent SQL Injection',
        description: 'Use parameterized queries exclusively',
        implementation: 'Replace all raw SQL with ORM methods or prepared statements',
      });
    }

    if (categories.has('xss')) {
      recommendations.push({
        priority: 95,
        title: 'Prevent XSS Attacks',
        description: 'Sanitize all user input',
        implementation: 'Use DOMPurify or similar library',
      });
    }

    if (categories.has('exposed_secrets')) {
      recommendations.push({
        priority: 100,
        title: 'Remove Exposed Secrets',
        description: 'Move all secrets to environment variables',
        implementation: 'Use .env files and never commit them',
      });
    }

    return recommendations;
  }
}
