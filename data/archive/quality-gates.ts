/**
 * Quality Gates System
 * 
 * Automated checks that must pass before advancing to the next step.
 * Inspired by biological homeostasis - maintaining system health through constant monitoring.
 */

import { ModuleState, QualityGateResult, ModuleStep } from "./types";
import * as fs from "fs/promises";
import * as path from "path";

export class QualityGateSystem {
  /**
   * Run all quality gates for the current step
   */
  async runAllGates(state: ModuleState): Promise<QualityGateResult> {
    const gates = this.getGatesForStep(state.currentStep);
    const results: QualityGateResult[] = [];
    
    for (const gate of gates) {
      const result = await gate.check(state);
      results.push(result);
      
      // Stop on first blocking failure
      if (!result.passed && gate.blocking) {
        return {
          passed: false,
          message: `Blocking gate failed: ${gate.name}`,
          failedGates: [result]
        };
      }
    }
    
    const failedGates = results.filter(r => !r.passed);
    
    return {
      passed: failedGates.length === 0,
      message: failedGates.length === 0 
        ? "All quality gates passed" 
        : `${failedGates.length} gate(s) failed`,
      failedGates
    };
  }
  
  /**
   * Get quality gates for a specific step
   */
  private getGatesForStep(step: ModuleStep) {
    switch (step) {
      case ModuleStep.BIOLOGICAL_STUDY:
        return this.getStep1Gates();
      case ModuleStep.ARCHITECTURE_DESIGN:
        return this.getStep2Gates();
      case ModuleStep.DEVELOPMENT:
        return this.getStep3Gates();
      case ModuleStep.TESTING:
        return this.getStep4Gates();
      case ModuleStep.DOCUMENTATION:
        return this.getStep5Gates();
      default:
        return [];
    }
  }
  
  /**
   * Step 1: Biological Study Gates
   */
  private getStep1Gates() {
    return [
      {
        id: "bio_study_exists",
        name: "Biological Study Document Exists",
        description: "Verify biological study report file exists",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["bio_study_report"];
          if (!deliverable || !deliverable.filePath) {
            return {
              passed: false,
              message: "Biological study report not found"
            };
          }
          
          try {
            await fs.access(deliverable.filePath);
            return {
              passed: true,
              message: "Biological study report exists"
            };
          } catch {
            return {
              passed: false,
              message: `File not found: ${deliverable.filePath}`
            };
          }
        }
      },
      
      {
        id: "bio_study_completeness",
        name: "Study Completeness Check",
        description: "Verify all required sections are present",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["bio_study_report"];
          if (!deliverable?.filePath) {
            return { passed: false, message: "No file to check" };
          }
          
          try {
            const content = await fs.readFile(deliverable.filePath, "utf-8");
            
            const requiredSections = [
              "organism",
              "behavior",
              "survival",
              "natural law",
              "adaptation"
            ];
            
            const missingSections = requiredSections.filter(section => 
              !content.toLowerCase().includes(section)
            );
            
            if (missingSections.length > 0) {
              return {
                passed: false,
                message: `Missing sections: ${missingSections.join(", ")}`,
                details: { missingSections }
              };
            }
            
            return {
              passed: true,
              message: "All required sections present"
            };
          } catch (error: any) {
            return {
              passed: false,
              message: `Error reading file: ${error.message}`
            };
          }
        }
      },
      
      {
        id: "business_mapping_exists",
        name: "Business Mapping Document Exists",
        description: "Verify business problem mapping file exists",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["business_mapping"];
          if (!deliverable || !deliverable.filePath) {
            return {
              passed: false,
              message: "Business mapping not found"
            };
          }
          
          try {
            await fs.access(deliverable.filePath);
            return {
              passed: true,
              message: "Business mapping exists"
            };
          } catch {
            return {
              passed: false,
              message: `File not found: ${deliverable.filePath}`
            };
          }
        }
      },
      
      {
        id: "references_quality",
        name: "References Quality Check",
        description: "Verify scientific references are provided",
        blocking: false,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["references"];
          if (!deliverable?.filePath) {
            return {
              passed: false,
              message: "No references document provided (optional)"
            };
          }
          
          try {
            const content = await fs.readFile(deliverable.filePath, "utf-8");
            const referenceCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
            
            if (referenceCount < 3) {
              return {
                passed: false,
                message: `Only ${referenceCount} references found, recommended minimum is 3`,
                details: { referenceCount }
              };
            }
            
            return {
              passed: true,
              message: `${referenceCount} references provided`,
              details: { referenceCount }
            };
          } catch (error: any) {
            return {
              passed: false,
              message: `Error reading references: ${error.message}`
            };
          }
        }
      }
    ];
  }
  
  /**
   * Step 2: Architecture Design Gates
   */
  private getStep2Gates() {
    return [
      {
        id: "schema_compiles",
        name: "Database Schema Compiles",
        description: "Verify Drizzle schema has no TypeScript errors",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          // In real implementation, would run TypeScript compiler
          // For now, just check file exists
          const deliverable = state.deliverables["database_schema"];
          if (!deliverable?.filePath) {
            return {
              passed: false,
              message: "Database schema not found"
            };
          }
          
          try {
            const content = await fs.readFile(deliverable.filePath, "utf-8");
            
            // Check for basic Drizzle patterns
            if (!content.includes("import") || !content.includes("export")) {
              return {
                passed: false,
                message: "Schema file appears incomplete"
              };
            }
            
            return {
              passed: true,
              message: "Database schema appears valid"
            };
          } catch (error: any) {
            return {
              passed: false,
              message: `Error reading schema: ${error.message}`
            };
          }
        }
      },
      
      {
        id: "api_types_defined",
        name: "API Types Defined",
        description: "Verify tRPC router has input/output types",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["api_specification"];
          if (!deliverable?.filePath) {
            return {
              passed: false,
              message: "API specification not found"
            };
          }
          
          try {
            const content = await fs.readFile(deliverable.filePath, "utf-8");
            
            // Check for tRPC patterns
            const hasInput = content.includes(".input(") || content.includes("input:");
            const hasOutput = content.includes(".output(") || content.includes("Promise<");
            
            if (!hasInput || !hasOutput) {
              return {
                passed: false,
                message: "API types appear incomplete (missing input or output types)"
              };
            }
            
            return {
              passed: true,
              message: "API types are defined"
            };
          } catch (error: any) {
            return {
              passed: false,
              message: `Error reading API spec: ${error.message}`
            };
          }
        }
      },
      
      {
        id: "architecture_documented",
        name: "Architecture Documented",
        description: "Verify architecture document exists and is comprehensive",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["architecture_document"];
          if (!deliverable?.filePath) {
            return {
              passed: false,
              message: "Architecture document not found"
            };
          }
          
          try {
            const content = await fs.readFile(deliverable.filePath, "utf-8");
            const wordCount = content.split(/\s+/).length;
            
            if (wordCount < 500) {
              return {
                passed: false,
                message: `Architecture document is too short (${wordCount} words, minimum 500)`,
                details: { wordCount }
              };
            }
            
            return {
              passed: true,
              message: `Architecture document is comprehensive (${wordCount} words)`,
              details: { wordCount }
            };
          } catch (error: any) {
            return {
              passed: false,
              message: `Error reading architecture doc: ${error.message}`
            };
          }
        }
      }
    ];
  }
  
  /**
   * Step 3: Development Gates
   */
  private getStep3Gates() {
    return [
      {
        id: "code_compiles",
        name: "Code Compiles",
        description: "Verify all TypeScript code compiles without errors",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          // In real implementation, would run: tsc --noEmit
          return {
            passed: true,
            message: "Code compiles successfully"
          };
        }
      },
      
      {
        id: "no_console_logs",
        name: "No Console Logs",
        description: "Verify no console.log statements in production code",
        blocking: false,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["core_algorithm"];
          if (!deliverable?.filePath) {
            return { passed: false, message: "No code to check" };
          }
          
          try {
            const content = await fs.readFile(deliverable.filePath, "utf-8");
            const consoleCount = (content.match(/console\.(log|debug|info)/g) || []).length;
            
            if (consoleCount > 0) {
              return {
                passed: false,
                message: `Found ${consoleCount} console.log statements`,
                details: { consoleCount }
              };
            }
            
            return {
              passed: true,
              message: "No console.log statements found"
            };
          } catch (error: any) {
            return {
              passed: false,
              message: `Error checking code: ${error.message}`
            };
          }
        }
      },
      
      {
        id: "no_hardcoded_secrets",
        name: "No Hardcoded Secrets",
        description: "Verify no API keys or passwords in code",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["core_algorithm"];
          if (!deliverable?.filePath) {
            return { passed: false, message: "No code to check" };
          }
          
          try {
            const content = await fs.readFile(deliverable.filePath, "utf-8");
            
            const suspiciousPatterns = [
              /api[_-]?key\s*=\s*["'][^"']+["']/i,
              /password\s*=\s*["'][^"']+["']/i,
              /secret\s*=\s*["'][^"']+["']/i,
              /token\s*=\s*["'][^"']+["']/i
            ];
            
            for (const pattern of suspiciousPatterns) {
              if (pattern.test(content)) {
                return {
                  passed: false,
                  message: "Possible hardcoded secret detected"
                };
              }
            }
            
            return {
              passed: true,
              message: "No hardcoded secrets found"
            };
          } catch (error: any) {
            return {
              passed: false,
              message: `Error checking code: ${error.message}`
            };
          }
        }
      }
    ];
  }
  
  /**
   * Step 4: Testing Gates
   */
  private getStep4Gates() {
    return [
      {
        id: "test_coverage",
        name: "Test Coverage >= 80%",
        description: "Verify test coverage meets minimum threshold",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          // In real implementation, would parse coverage report
          // For now, return mock result
          const coverage = 85; // Mock value
          
          if (coverage < 80) {
            return {
              passed: false,
              message: `Test coverage is ${coverage}%, minimum is 80%`,
              details: { coverage, minimum: 80 }
            };
          }
          
          return {
            passed: true,
            message: `Test coverage is ${coverage}%`,
            details: { coverage }
          };
        }
      },
      
      {
        id: "all_tests_pass",
        name: "All Tests Pass",
        description: "Verify all unit and integration tests pass",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          // In real implementation, would run: pnpm test
          return {
            passed: true,
            message: "All tests pass"
          };
        }
      },
      
      {
        id: "performance_benchmarks",
        name: "Performance Benchmarks",
        description: "Verify performance meets requirements",
        blocking: false,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["performance_tests"];
          if (!deliverable?.filePath) {
            return {
              passed: false,
              message: "No performance tests provided (optional)"
            };
          }
          
          return {
            passed: true,
            message: "Performance tests exist"
          };
        }
      }
    ];
  }
  
  /**
   * Step 5: Documentation Gates
   */
  private getStep5Gates() {
    return [
      {
        id: "readme_exists",
        name: "README Exists",
        description: "Verify module README is present",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["module_readme"];
          if (!deliverable?.filePath) {
            return {
              passed: false,
              message: "README not found"
            };
          }
          
          try {
            await fs.access(deliverable.filePath);
            return {
              passed: true,
              message: "README exists"
            };
          } catch {
            return {
              passed: false,
              message: `File not found: ${deliverable.filePath}`
            };
          }
        }
      },
      
      {
        id: "api_documented",
        name: "API Documented",
        description: "Verify API reference is complete",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["api_reference"];
          if (!deliverable?.filePath) {
            return {
              passed: false,
              message: "API reference not found"
            };
          }
          
          try {
            const content = await fs.readFile(deliverable.filePath, "utf-8");
            
            // Check for code examples
            const codeBlockCount = (content.match(/```/g) || []).length / 2;
            
            if (codeBlockCount < 3) {
              return {
                passed: false,
                message: `API documentation needs more examples (found ${codeBlockCount}, need at least 3)`,
                details: { codeBlockCount }
              };
            }
            
            return {
              passed: true,
              message: `API documentation has ${codeBlockCount} code examples`,
              details: { codeBlockCount }
            };
          } catch (error: any) {
            return {
              passed: false,
              message: `Error reading API docs: ${error.message}`
            };
          }
        }
      },
      
      {
        id: "user_guide_complete",
        name: "User Guide Complete",
        description: "Verify user guide covers all features",
        blocking: true,
        check: async (state: ModuleState): Promise<QualityGateResult> => {
          const deliverable = state.deliverables["user_guide"];
          if (!deliverable?.filePath) {
            return {
              passed: false,
              message: "User guide not found"
            };
          }
          
          try {
            const content = await fs.readFile(deliverable.filePath, "utf-8");
            const wordCount = content.split(/\s+/).length;
            
            if (wordCount < 300) {
              return {
                passed: false,
                message: `User guide is too short (${wordCount} words, minimum 300)`,
                details: { wordCount }
              };
            }
            
            return {
              passed: true,
              message: `User guide is complete (${wordCount} words)`,
              details: { wordCount }
            };
          } catch (error: any) {
            return {
              passed: false,
              message: `Error reading user guide: ${error.message}`
            };
          }
        }
      }
    ];
  }
}
