#!/usr/bin/env node
/**
 * HADEROS AI Assistant CLI
 * Command-line interface for AI-powered code analysis, testing, and security
 */

import { Command } from 'commander';
import { CodeAnalyzer } from '../modules/code-analyzer';
import { TestGenerator } from '../modules/test-generator';
import { SecurityAuditor } from '../modules/security-auditor';
import * as fs from 'fs/promises';
import * as path from 'path';

const program = new Command();

program
  .name('haderos-ai')
  .description('HADEROS AI Assistant - Automated code analysis, testing, and security')
  .version('1.0.0');

/**
 * Code Analysis Command
 */
program
  .command('analyze')
  .description('Analyze code quality and find issues')
  .argument('<path>', 'File or directory to analyze')
  .option('-o, --output <file>', 'Output report file')
  .option('-f, --format <format>', 'Output format (markdown|json)', 'markdown')
  .action(async (targetPath, options) => {
    console.log('🔍 Starting code analysis...\n');

    try {
      const analyzer = new CodeAnalyzer();
      const stats = await fs.stat(targetPath);

      let results;
      if (stats.isDirectory()) {
        console.log(`📁 Analyzing directory: ${targetPath}`);
        results = await analyzer.analyzeDirectory(targetPath);
      } else {
        console.log(`📄 Analyzing file: ${targetPath}`);
        results = [await analyzer.analyzeFile(targetPath)];
      }

      console.log(`\n✅ Analysis complete! Found ${results.length} file(s)\n`);

      // Generate report
      const report = analyzer.generateReport(results);

      // Output report
      if (options.output) {
        await fs.writeFile(options.output, report);
        console.log(`📄 Report saved to: ${options.output}`);
      } else {
        console.log(report);
      }

      // Summary
      const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

      console.log(`\n📊 Summary:`);
      console.log(`   Files: ${results.length}`);
      console.log(`   Issues: ${totalIssues}`);
      console.log(`   Average Score: ${avgScore.toFixed(1)}/100`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Test Generation Command
 */
program
  .command('generate-tests')
  .description('Generate tests for code files')
  .argument('<path>', 'File or directory to generate tests for')
  .option('-o, --output <file>', 'Output report file')
  .action(async (targetPath, options) => {
    console.log('🧪 Starting test generation...\n');

    try {
      const generator = new TestGenerator();
      const stats = await fs.stat(targetPath);

      let results;
      if (stats.isDirectory()) {
        console.log(`📁 Generating tests for directory: ${targetPath}`);
        results = await generator.generateTestsForDirectory(targetPath);
      } else {
        console.log(`📄 Generating tests for file: ${targetPath}`);
        results = [await generator.generateTests(targetPath)];
      }

      console.log(`\n✅ Test generation complete! Generated ${results.length} test file(s)\n`);

      // Generate report
      const report = generator.generateReport(results);

      // Output report
      if (options.output) {
        await fs.writeFile(options.output, report);
        console.log(`📄 Report saved to: ${options.output}`);
      } else {
        console.log(report);
      }

      // Summary
      const totalTests = results.reduce((sum, r) => sum + r.scenarios.length, 0);
      const avgCoverage = results.reduce((sum, r) => sum + r.coverage.lines, 0) / results.length;

      console.log(`\n📊 Summary:`);
      console.log(`   Test Files: ${results.length}`);
      console.log(`   Test Cases: ${totalTests}`);
      console.log(`   Estimated Coverage: ${avgCoverage.toFixed(1)}%`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Security Audit Command
 */
program
  .command('audit')
  .description('Perform security audit on code')
  .argument('<path>', 'File or directory to audit')
  .option('-o, --output <file>', 'Output report file')
  .action(async (targetPath, options) => {
    console.log('🔒 Starting security audit...\n');

    try {
      const auditor = new SecurityAuditor();
      const stats = await fs.stat(targetPath);

      let results;
      if (stats.isDirectory()) {
        console.log(`📁 Auditing directory: ${targetPath}`);
        results = await auditor.auditDirectory(targetPath);
      } else {
        console.log(`📄 Auditing file: ${targetPath}`);
        results = [await auditor.auditFile(targetPath)];
      }

      console.log(`\n✅ Security audit complete! Audited ${results.length} file(s)\n`);

      // Generate report
      const report = auditor.generateReport(results);

      // Output report
      if (options.output) {
        await fs.writeFile(options.output, report);
        console.log(`📄 Report saved to: ${options.output}`);
      } else {
        console.log(report);
      }

      // Summary
      const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
      const criticalIssues = results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 0);
      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

      console.log(`\n📊 Summary:`);
      console.log(`   Files: ${results.length}`);
      console.log(`   Issues: ${totalIssues} (${criticalIssues} critical)`);
      console.log(`   Average Score: ${avgScore.toFixed(1)}/100`);

      if (criticalIssues > 0) {
        console.log(`\n🚨 WARNING: ${criticalIssues} critical security issue(s) found!`);
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

/**
 * Full Scan Command (All-in-one)
 */
program
  .command('scan')
  .description('Run full analysis: code review + tests + security audit')
  .argument('<path>', 'Directory to scan')
  .option('-o, --output-dir <dir>', 'Output directory for reports', './ai-reports')
  .action(async (targetPath, options) => {
    console.log('🚀 Starting full scan...\n');

    try {
      // Create output directory
      await fs.mkdir(options.outputDir, { recursive: true });

      // 1. Code Analysis
      console.log('📊 Step 1/3: Code Analysis');
      const analyzer = new CodeAnalyzer();
      const analysisResults = await analyzer.analyzeDirectory(targetPath);
      const analysisReport = analyzer.generateReport(analysisResults);
      await fs.writeFile(path.join(options.outputDir, 'code-analysis.md'), analysisReport);
      console.log('✅ Code analysis complete\n');

      // 2. Test Generation
      console.log('🧪 Step 2/3: Test Generation');
      const generator = new TestGenerator();
      const testResults = await generator.generateTestsForDirectory(targetPath);
      const testReport = generator.generateReport(testResults);
      await fs.writeFile(path.join(options.outputDir, 'test-generation.md'), testReport);
      console.log('✅ Test generation complete\n');

      // 3. Security Audit
      console.log('🔒 Step 3/3: Security Audit');
      const auditor = new SecurityAuditor();
      const securityResults = await auditor.auditDirectory(targetPath);
      const securityReport = auditor.generateReport(securityResults);
      await fs.writeFile(path.join(options.outputDir, 'security-audit.md'), securityReport);
      console.log('✅ Security audit complete\n');

      // Generate summary
      const summary = `# HADEROS AI Assistant - Full Scan Report

## Summary

- **Scanned Directory:** ${targetPath}
- **Scan Date:** ${new Date().toISOString()}

### Code Analysis
- Files Analyzed: ${analysisResults.length}
- Average Score: ${(analysisResults.reduce((sum, r) => sum + r.score, 0) / analysisResults.length).toFixed(1)}/100

### Test Generation
- Test Files Generated: ${testResults.length}
- Total Test Cases: ${testResults.reduce((sum, r) => sum + r.scenarios.length, 0)}

### Security Audit
- Files Audited: ${securityResults.length}
- Critical Issues: ${securityResults.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 0)}
- Average Security Score: ${(securityResults.reduce((sum, r) => sum + r.score, 0) / securityResults.length).toFixed(1)}/100

## Reports

- [Code Analysis Report](./code-analysis.md)
- [Test Generation Report](./test-generation.md)
- [Security Audit Report](./security-audit.md)
`;

      await fs.writeFile(path.join(options.outputDir, 'README.md'), summary);

      console.log(`\n✅ Full scan complete!`);
      console.log(`📁 Reports saved to: ${options.outputDir}`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
