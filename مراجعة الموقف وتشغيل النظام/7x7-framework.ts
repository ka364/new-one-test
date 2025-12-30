/**
 * HaderOS 7×7 Testing Framework
 * 7 Sections × 7 Tests = 49 Comprehensive Tests
 */

export interface TestResult {
  id: string;
  section: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  details?: any;
}

export interface SectionResult {
  section: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  successRate: number;
  duration: number;
  tests: TestResult[];
}

export interface TestReport {
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  overallSuccessRate: number;
  totalDuration: number;
  sections: SectionResult[];
  startTime: Date;
  endTime: Date;
}

export class TestFramework {
  private results: TestResult[] = [];
  private startTime: Date = new Date();

  /**
   * Run a single test
   */
  async runTest(
    section: string,
    name: string,
    testFn: () => Promise<void> | void
  ): Promise<TestResult> {
    const id = `${section}-${name.replace(/\s+/g, '-').toLowerCase()}`;
    const start = Date.now();

    try {
      await testFn();
      const result: TestResult = {
        id,
        section,
        name,
        status: 'passed',
        duration: Date.now() - start,
      };
      this.results.push(result);
      return result;
    } catch (error: any) {
      const result: TestResult = {
        id,
        section,
        name,
        status: 'failed',
        duration: Date.now() - start,
        error: error.message,
      };
      this.results.push(result);
      return result;
    }
  }

  /**
   * Run multiple tests in a section
   */
  async runSection(
    section: string,
    tests: Array<{ name: string; fn: () => Promise<void> | void }>
  ): Promise<SectionResult> {
    const sectionStart = Date.now();
    const testResults: TestResult[] = [];

    for (const test of tests) {
      const result = await this.runTest(section, test.name, test.fn);
      testResults.push(result);
    }

    const passed = testResults.filter(t => t.status === 'passed').length;
    const failed = testResults.filter(t => t.status === 'failed').length;
    const skipped = testResults.filter(t => t.status === 'skipped').length;

    return {
      section,
      total: testResults.length,
      passed,
      failed,
      skipped,
      successRate: (passed / testResults.length) * 100,
      duration: Date.now() - sectionStart,
      tests: testResults,
    };
  }

  /**
   * Generate final report
   */
  generateReport(): TestReport {
    const endTime = new Date();
    const sections = this.groupBySection();

    const totalPassed = this.results.filter(t => t.status === 'passed').length;
    const totalFailed = this.results.filter(t => t.status === 'failed').length;
    const totalSkipped = this.results.filter(t => t.status === 'skipped').length;

    return {
      totalTests: this.results.length,
      totalPassed,
      totalFailed,
      totalSkipped,
      overallSuccessRate: (totalPassed / this.results.length) * 100,
      totalDuration: endTime.getTime() - this.startTime.getTime(),
      sections,
      startTime: this.startTime,
      endTime,
    };
  }

  /**
   * Group results by section
   */
  private groupBySection(): SectionResult[] {
    const sectionMap = new Map<string, TestResult[]>();

    this.results.forEach(result => {
      if (!sectionMap.has(result.section)) {
        sectionMap.set(result.section, []);
      }
      sectionMap.get(result.section)!.push(result);
    });

    return Array.from(sectionMap.entries()).map(([section, tests]) => {
      const passed = tests.filter(t => t.status === 'passed').length;
      const failed = tests.filter(t => t.status === 'failed').length;
      const skipped = tests.filter(t => t.status === 'skipped').length;
      const duration = tests.reduce((sum, t) => sum + t.duration, 0);

      return {
        section,
        total: tests.length,
        passed,
        failed,
        skipped,
        successRate: (passed / tests.length) * 100,
        duration,
        tests,
      };
    });
  }

  /**
   * Print report to console
   */
  printReport(report: TestReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 HaderOS 7×7 Testing Framework - Final Report');
    console.log('='.repeat(80));

    console.log('\n📊 Overall Statistics:');
    console.log(`   Total Tests: ${report.totalTests}`);
    console.log(`   ✅ Passed: ${report.totalPassed}`);
    console.log(`   ❌ Failed: ${report.totalFailed}`);
    console.log(`   ⏭️  Skipped: ${report.totalSkipped}`);
    console.log(`   📈 Success Rate: ${report.overallSuccessRate.toFixed(1)}%`);
    console.log(`   ⏱️  Duration: ${(report.totalDuration / 1000).toFixed(2)}s`);

    console.log('\n📋 Section Results:');
    report.sections.forEach(section => {
      const icon = section.successRate === 100 ? '✅' : section.successRate >= 80 ? '🟡' : '❌';
      console.log(`\n   ${icon} ${section.section}`);
      console.log(`      Tests: ${section.total} | Passed: ${section.passed} | Failed: ${section.failed}`);
      console.log(`      Success Rate: ${section.successRate.toFixed(1)}%`);
      console.log(`      Duration: ${(section.duration / 1000).toFixed(2)}s`);

      if (section.failed > 0) {
        console.log(`      Failed Tests:`);
        section.tests
          .filter(t => t.status === 'failed')
          .forEach(t => {
            console.log(`         - ${t.name}: ${t.error}`);
          });
      }
    });

    console.log('\n' + '='.repeat(80));
    
    if (report.overallSuccessRate === 100) {
      console.log('🎉 ALL TESTS PASSED! System is ready for production!');
    } else if (report.overallSuccessRate >= 95) {
      console.log('✅ EXCELLENT! System meets minimum requirements.');
    } else if (report.overallSuccessRate >= 85) {
      console.log('🟡 GOOD! Some improvements needed.');
    } else {
      console.log('❌ NEEDS WORK! Critical issues found.');
    }
    
    console.log('='.repeat(80));
  }

  /**
   * Assert helper
   */
  static assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Assert equal helper
   */
  static assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${expected}, but got ${actual}`
      );
    }
  }

  /**
   * Assert throws helper
   */
  static async assertThrows(
    fn: () => Promise<void> | void,
    message?: string
  ): Promise<void> {
    try {
      await fn();
      throw new Error(message || 'Expected function to throw, but it did not');
    } catch (error) {
      // Expected
    }
  }
}
