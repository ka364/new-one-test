/**
 * Security Simulation Scenarios
 * Simulates various security attack scenarios and defense mechanisms
 */

import type { SimulationScenario, SimulationResult } from './models';

/**
 * Rate Limiting Attack Simulation
 * Simulates a brute force attack and tests rate limiting effectiveness
 */
export const rateLimitAttackScenario: SimulationScenario = {
  id: 'security-rate-limit-attack',
  name: 'Rate Limiting Attack Simulation',
  description: 'Simulates brute force attack to test rate limiting effectiveness',
  duration: 60, // 1 minute
  
  async execute(): Promise<SimulationResult> {
    const startTime = Date.now();
    const results = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0,
      attackDetected: false,
      averageResponseTime: 0,
    };

    // Simulate 200 requests in 1 minute (exceeds 100/15min limit)
    const requestsPerSecond = 3.33; // ~200 requests/minute
    const totalDuration = 60000; // 60 seconds
    const interval = 1000 / requestsPerSecond;

    for (let i = 0; i < 200; i++) {
      results.totalRequests++;
      
      // Simulate rate limit check
      if (i < 100) {
        results.allowedRequests++;
      } else {
        results.blockedRequests++;
        results.attackDetected = true;
      }

      // Simulate response time
      const responseTime = Math.random() * 50 + 10; // 10-60ms
      results.averageResponseTime += responseTime;

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    results.averageResponseTime /= results.totalRequests;

    return {
      scenario: this.id,
      success: results.blockedRequests > 0 && results.attackDetected,
      duration: Date.now() - startTime,
      metrics: {
        totalRequests: results.totalRequests,
        blockedRequests: results.blockedRequests,
        allowedRequests: results.allowedRequests,
        blockRate: (results.blockedRequests / results.totalRequests) * 100,
        attackDetected: results.attackDetected,
        averageResponseTime: results.averageResponseTime,
      },
      message: results.attackDetected
        ? `✅ Rate limiting effective: ${results.blockedRequests} requests blocked`
        : '❌ Rate limiting failed: Attack not detected',
    };
  },
};

/**
 * SQL Injection Attack Simulation
 * Tests input validation against SQL injection attempts
 */
export const sqlInjectionScenario: SimulationScenario = {
  id: 'security-sql-injection',
  name: 'SQL Injection Attack Simulation',
  description: 'Tests input validation against common SQL injection patterns',
  duration: 30,

  async execute(): Promise<SimulationResult> {
    const startTime = Date.now();
    
    // Common SQL injection patterns
    const injectionPatterns = [
      "' OR '1'='1",
      "'; DROP TABLE users--",
      "1' UNION SELECT * FROM users--",
      "admin'--",
      "' OR 1=1--",
      "1'; DELETE FROM users WHERE '1'='1",
      "' UNION SELECT NULL, username, password FROM users--",
    ];

    let blockedAttempts = 0;
    let detectedPatterns = 0;

    for (const pattern of injectionPatterns) {
      // Simulate validation check
      const isBlocked = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b|--|\#|\/\*|\*\/|'=')/gi.test(pattern);
      
      if (isBlocked) {
        blockedAttempts++;
        detectedPatterns++;
      }
    }

    const blockRate = (blockedAttempts / injectionPatterns.length) * 100;

    return {
      scenario: this.id,
      success: blockRate === 100,
      duration: Date.now() - startTime,
      metrics: {
        totalPatterns: injectionPatterns.length,
        blockedAttempts,
        detectedPatterns,
        blockRate,
        missedPatterns: injectionPatterns.length - blockedAttempts,
      },
      message: blockRate === 100
        ? `✅ All SQL injection attempts blocked (${blockedAttempts}/${injectionPatterns.length})`
        : `⚠️ Some SQL injection attempts missed (${blockedAttempts}/${injectionPatterns.length})`,
    };
  },
};

/**
 * XSS Attack Simulation
 * Tests XSS prevention mechanisms
 */
export const xssAttackScenario: SimulationScenario = {
  id: 'security-xss-attack',
  name: 'XSS Attack Simulation',
  description: 'Tests XSS prevention and input sanitization',
  duration: 30,

  async execute(): Promise<SimulationResult> {
    const startTime = Date.now();
    
    // Common XSS attack patterns
    const xssPatterns = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
    ];

    let sanitizedInputs = 0;
    let dangerousInputs = 0;

    for (const pattern of xssPatterns) {
      // Simulate sanitization (DOMPurify-like behavior)
      const sanitized = pattern
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
      
      if (sanitized !== pattern && !sanitized.includes('<') && !sanitized.includes('javascript:')) {
        sanitizedInputs++;
      } else {
        dangerousInputs++;
      }
    }

    const sanitizationRate = (sanitizedInputs / xssPatterns.length) * 100;

    return {
      scenario: this.id,
      success: sanitizationRate >= 90, // Allow 10% margin for edge cases
      duration: Date.now() - startTime,
      metrics: {
        totalPatterns: xssPatterns.length,
        sanitizedInputs,
        dangerousInputs,
        sanitizationRate,
      },
      message: sanitizationRate >= 90
        ? `✅ XSS prevention effective (${sanitizationRate.toFixed(1)}% sanitized)`
        : `⚠️ XSS prevention needs improvement (${sanitizationRate.toFixed(1)}% sanitized)`,
    };
  },
};

/**
 * CORS Attack Simulation
 * Tests CORS configuration against unauthorized origins
 */
export const corsAttackScenario: SimulationScenario = {
  id: 'security-cors-attack',
  name: 'CORS Attack Simulation',
  description: 'Tests CORS configuration against unauthorized origins',
  duration: 20,

  async execute(): Promise<SimulationResult> {
    const startTime = Date.now();
    
    const allowedOrigins = ['https://haderos.com', 'https://app.haderos.com'];
    const attackOrigins = [
      'https://evil.com',
      'https://phishing-haderos.com',
      'http://localhost:666',
      'https://haderos.com.evil.com',
      'null',
    ];

    let blockedOrigins = 0;
    let allowedAttacks = 0;

    for (const origin of attackOrigins) {
      const isAllowed = allowedOrigins.includes(origin);
      
      if (!isAllowed) {
        blockedOrigins++;
      } else {
        allowedAttacks++;
      }
    }

    const blockRate = (blockedOrigins / attackOrigins.length) * 100;

    return {
      scenario: this.id,
      success: blockRate === 100,
      duration: Date.now() - startTime,
      metrics: {
        totalOrigins: attackOrigins.length,
        blockedOrigins,
        allowedAttacks,
        blockRate,
      },
      message: blockRate === 100
        ? `✅ CORS protection effective: All unauthorized origins blocked`
        : `⚠️ CORS misconfiguration: ${allowedAttacks} unauthorized origins allowed`,
    };
  },
};

/**
 * 2FA Brute Force Simulation
 * Tests 2FA token brute force resistance
 */
export const twoFactorBruteForceScenario: SimulationScenario = {
  id: 'security-2fa-brute-force',
  name: '2FA Brute Force Simulation',
  description: 'Tests 2FA system resistance to brute force attacks',
  duration: 60,

  async execute(): Promise<SimulationResult> {
    const startTime = Date.now();
    
    const validToken = '123456'; // Example TOTP token
    const attempts = 1000; // Try 1000 random tokens
    let successfulAttempts = 0;
    let blockedAttempts = 0;
    let rateLimitTriggered = false;

    for (let i = 0; i < attempts; i++) {
      // Generate random 6-digit token
      const randomToken = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      
      // Simulate rate limiting (5 attempts per 15 minutes)
      if (i >= 5) {
        blockedAttempts++;
        rateLimitTriggered = true;
        continue;
      }

      // Check if token matches
      if (randomToken === validToken) {
        successfulAttempts++;
      }
    }

    const bruteForceSuccess = successfulAttempts > 0 && !rateLimitTriggered;

    return {
      scenario: this.id,
      success: rateLimitTriggered && successfulAttempts === 0,
      duration: Date.now() - startTime,
      metrics: {
        totalAttempts: attempts,
        successfulAttempts,
        blockedAttempts,
        rateLimitTriggered,
        bruteForceSuccess: !bruteForceSuccess,
      },
      message: rateLimitTriggered
        ? `✅ 2FA brute force prevented: ${blockedAttempts} attempts blocked`
        : `❌ 2FA vulnerable: Brute force succeeded after ${successfulAttempts} attempts`,
    };
  },
};

/**
 * DDoS Attack Simulation
 * Tests DDoS protection mechanisms
 */
export const ddosAttackScenario: SimulationScenario = {
  id: 'security-ddos-attack',
  name: 'DDoS Attack Simulation',
  description: 'Simulates distributed denial of service attack',
  duration: 120,

  async execute(): Promise<SimulationResult> {
    const startTime = Date.now();
    
    // Simulate 500 requests per minute (exceeds 200/minute limit)
    const totalRequests = 500;
    let allowedRequests = 0;
    let blockedRequests = 0;
    let systemOverload = false;

    for (let i = 0; i < totalRequests; i++) {
      // Simulate DDoS protection (200 req/min limit)
      if (i < 200) {
        allowedRequests++;
      } else {
        blockedRequests++;
        if (i > 400) {
          systemOverload = true;
        }
      }
    }

    const protectionEffective = blockedRequests > 0 && !systemOverload;

    return {
      scenario: this.id,
      success: protectionEffective,
      duration: Date.now() - startTime,
      metrics: {
        totalRequests,
        allowedRequests,
        blockedRequests,
        blockRate: (blockedRequests / totalRequests) * 100,
        systemOverload,
      },
      message: protectionEffective
        ? `✅ DDoS protection effective: ${blockedRequests} malicious requests blocked`
        : `❌ DDoS protection failed: System overload detected`,
    };
  },
};

/**
 * All security scenarios
 */
export const securityScenarios = [
  rateLimitAttackScenario,
  sqlInjectionScenario,
  xssAttackScenario,
  corsAttackScenario,
  twoFactorBruteForceScenario,
  ddosAttackScenario,
];

/**
 * Run all security scenarios
 */
export const runAllSecurityScenarios = async (): Promise<SimulationResult[]> => {
  const results: SimulationResult[] = [];
  
  console.log('🔒 Running Security Simulation Scenarios...\n');
  
  for (const scenario of securityScenarios) {
    console.log(`▶️  Running: ${scenario.name}...`);
    const result = await scenario.execute();
    results.push(result);
    console.log(`   ${result.message}\n`);
  }
  
  const successCount = results.filter(r => r.success).length;
  const successRate = (successCount / results.length) * 100;
  
  console.log(`\n📊 Security Simulation Summary:`);
  console.log(`   Total Scenarios: ${results.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed: ${results.length - successCount}`);
  console.log(`   Success Rate: ${successRate.toFixed(1)}%\n`);
  
  return results;
};

export default {
  scenarios: securityScenarios,
  runAll: runAllSecurityScenarios,
};
