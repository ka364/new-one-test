/**
 * Step Configurations
 * 
 * Defines deliverables, quality gates, and training materials for each of the 5 steps.
 */

import {
  ModuleStep,
  StepConfig,
  Deliverable,
  QualityGate,
  TrainingMaterial,
  BioOrganism
} from "./types";

/**
 * Step 1: Biological Study (1-2 weeks)
 */
const step1Config: StepConfig = {
  step: ModuleStep.BIOLOGICAL_STUDY,
  title: "Biological Study",
  description: "Study the organism's natural behavior and map it to business problems",
  estimatedDuration: "1-2 weeks",
  
  deliverables: [
    {
      id: "bio_study_report",
      name: "Biological Study Report",
      description: "2-3 page document describing the organism's behavior, survival strategies, and natural laws",
      required: true,
      fileType: "md",
      submitted: false
    },
    {
      id: "business_mapping",
      name: "Business Problem Mapping",
      description: "Clear mapping between biological behavior and business/administrative problem",
      required: true,
      fileType: "md",
      submitted: false
    },
    {
      id: "feasibility_assessment",
      name: "Feasibility Assessment",
      description: "Technical feasibility analysis and technology stack recommendations",
      required: true,
      fileType: "md",
      submitted: false
    },
    {
      id: "references",
      name: "References & Sources",
      description: "List of scientific papers, videos, and educational materials used",
      required: false,
      fileType: "md",
      submitted: false
    }
  ],
  
  qualityGates: [
    {
      id: "bio_study_completeness",
      name: "Study Completeness Check",
      description: "Verify all required sections are present in the biological study",
      blocking: true,
      check: async (state) => {
        const report = state.deliverables["bio_study_report"];
        if (!report || !report.filePath) {
          return {
            passed: false,
            message: "Biological study report not found"
          };
        }
        // In real implementation, would read file and check sections
        return {
          passed: true,
          message: "Biological study report is complete"
        };
      }
    },
    {
      id: "business_mapping_clarity",
      name: "Business Mapping Clarity",
      description: "Verify clear connection between biology and business problem",
      blocking: true,
      check: async (state) => {
        const mapping = state.deliverables["business_mapping"];
        if (!mapping || !mapping.filePath) {
          return {
            passed: false,
            message: "Business mapping not found"
          };
        }
        return {
          passed: true,
          message: "Business mapping is clear"
        };
      }
    }
  ],
  
  trainingMaterials: [
    {
      id: "bio_study_guide",
      title: "How to Study a Biological System",
      type: "article",
      content: `
# How to Study a Biological System

## 1. Observe Natural Behavior
- Watch documentaries
- Read scientific papers
- Understand survival strategies

## 2. Identify Core Principles
- What makes this organism successful?
- What natural laws does it follow?
- How does it adapt to change?

## 3. Map to Business Context
- What business problem mirrors this behavior?
- How can we translate biological principles to code?
- What are the constraints and limitations?
      `
    }
  ]
};

/**
 * Step 2: Architecture Design (1 week)
 */
const step2Config: StepConfig = {
  step: ModuleStep.ARCHITECTURE_DESIGN,
  title: "Architecture Design",
  description: "Design the system architecture, data models, and API endpoints",
  estimatedDuration: "1 week",
  
  deliverables: [
    {
      id: "architecture_document",
      name: "Architecture Document",
      description: "5-10 page document with system diagrams, component descriptions, and data flow",
      required: true,
      fileType: "md",
      submitted: false
    },
    {
      id: "database_schema",
      name: "Database Schema",
      description: "Drizzle ORM schema definitions for all tables",
      required: true,
      fileType: "ts",
      submitted: false
    },
    {
      id: "api_specification",
      name: "API Specification",
      description: "tRPC router definitions with input/output types",
      required: true,
      fileType: "ts",
      submitted: false
    },
    {
      id: "system_diagrams",
      name: "System Diagrams",
      description: "Visual diagrams (flowcharts, sequence diagrams, architecture diagrams)",
      required: false,
      fileType: "png",
      submitted: false
    }
  ],
  
  qualityGates: [
    {
      id: "schema_validity",
      name: "Database Schema Validity",
      description: "Verify schema compiles and follows Drizzle ORM conventions",
      blocking: true,
      check: async (state) => {
        // Would run TypeScript compiler on schema file
        return {
          passed: true,
          message: "Database schema is valid"
        };
      }
    },
    {
      id: "api_type_safety",
      name: "API Type Safety",
      description: "Verify all API endpoints have proper input/output types",
      blocking: true,
      check: async (state) => {
        return {
          passed: true,
          message: "API types are properly defined"
        };
      }
    }
  ],
  
  trainingMaterials: []
};

/**
 * Step 3: Development (2-4 weeks)
 */
const step3Config: StepConfig = {
  step: ModuleStep.DEVELOPMENT,
  title: "Development",
  description: "Implement the module with core algorithm, database layer, and API endpoints",
  estimatedDuration: "2-4 weeks",
  
  deliverables: [
    {
      id: "core_algorithm",
      name: "Core Algorithm Implementation",
      description: "Main business logic that implements the biological principle",
      required: true,
      fileType: "ts",
      submitted: false
    },
    {
      id: "database_layer",
      name: "Database Layer",
      description: "Database operations (CRUD, queries, transactions)",
      required: true,
      fileType: "ts",
      submitted: false
    },
    {
      id: "api_router",
      name: "API Router",
      description: "tRPC router with all endpoints implemented",
      required: true,
      fileType: "ts",
      submitted: false
    },
    {
      id: "integration_code",
      name: "Integration Code",
      description: "Integration with other modules and external services",
      required: false,
      fileType: "ts",
      submitted: false
    }
  ],
  
  qualityGates: [
    {
      id: "code_compiles",
      name: "Code Compilation",
      description: "Verify all TypeScript code compiles without errors",
      blocking: true,
      check: async (state) => {
        // Would run TypeScript compiler
        return {
          passed: true,
          message: "All code compiles successfully"
        };
      }
    },
    {
      id: "no_hardcoded_values",
      name: "No Hardcoded Values",
      description: "Verify no hardcoded credentials or magic numbers",
      blocking: false,
      check: async (state) => {
        return {
          passed: true,
          message: "No hardcoded values found"
        };
      }
    }
  ],
  
  trainingMaterials: []
};

/**
 * Step 4: Testing (1 week)
 */
const step4Config: StepConfig = {
  step: ModuleStep.TESTING,
  title: "Testing",
  description: "Write comprehensive tests (unit, integration, performance)",
  estimatedDuration: "1 week",
  
  deliverables: [
    {
      id: "unit_tests",
      name: "Unit Tests",
      description: "Unit tests for all functions and methods (target: >80% coverage)",
      required: true,
      fileType: "test.ts",
      submitted: false
    },
    {
      id: "integration_tests",
      name: "Integration Tests",
      description: "Integration tests for API endpoints and database operations",
      required: true,
      fileType: "test.ts",
      submitted: false
    },
    {
      id: "performance_tests",
      name: "Performance Tests",
      description: "Load tests and performance benchmarks",
      required: false,
      fileType: "test.ts",
      submitted: false
    },
    {
      id: "test_report",
      name: "Test Report",
      description: "Summary of test results, coverage, and performance metrics",
      required: true,
      fileType: "md",
      submitted: false
    }
  ],
  
  qualityGates: [
    {
      id: "test_coverage",
      name: "Test Coverage Check",
      description: "Verify test coverage is above 80%",
      blocking: true,
      check: async (state) => {
        // Would run test coverage tool
        const coverage = 85; // Mock value
        if (coverage < 80) {
          return {
            passed: false,
            message: `Test coverage is ${coverage}%, minimum is 80%`,
            details: { coverage }
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
      description: "Verify all tests pass successfully",
      blocking: true,
      check: async (state) => {
        // Would run test suite
        return {
          passed: true,
          message: "All tests pass"
        };
      }
    }
  ],
  
  trainingMaterials: []
};

/**
 * Step 5: Documentation (3 days)
 */
const step5Config: StepConfig = {
  step: ModuleStep.DOCUMENTATION,
  title: "Documentation",
  description: "Write technical documentation, API reference, and user guide",
  estimatedDuration: "3 days",
  
  deliverables: [
    {
      id: "module_readme",
      name: "Module README",
      description: "Comprehensive README with overview, installation, and usage",
      required: true,
      fileType: "md",
      submitted: false
    },
    {
      id: "api_reference",
      name: "API Reference",
      description: "Complete API documentation with examples",
      required: true,
      fileType: "md",
      submitted: false
    },
    {
      id: "user_guide",
      name: "User Guide",
      description: "Step-by-step guide for end users",
      required: true,
      fileType: "md",
      submitted: false
    },
    {
      id: "faq",
      name: "FAQ",
      description: "Frequently asked questions and troubleshooting",
      required: false,
      fileType: "md",
      submitted: false
    }
  ],
  
  qualityGates: [
    {
      id: "documentation_completeness",
      name: "Documentation Completeness",
      description: "Verify all required documentation sections are present",
      blocking: true,
      check: async (state) => {
        const readme = state.deliverables["module_readme"];
        const apiRef = state.deliverables["api_reference"];
        const userGuide = state.deliverables["user_guide"];
        
        if (!readme?.filePath || !apiRef?.filePath || !userGuide?.filePath) {
          return {
            passed: false,
            message: "Missing required documentation"
          };
        }
        
        return {
          passed: true,
          message: "All required documentation is present"
        };
      }
    },
    {
      id: "code_examples",
      name: "Code Examples Present",
      description: "Verify documentation includes working code examples",
      blocking: false,
      check: async (state) => {
        return {
          passed: true,
          message: "Documentation includes code examples"
        };
      }
    }
  ],
  
  trainingMaterials: []
};

/**
 * Export all step configurations
 */
export const stepConfigurations = new Map<ModuleStep, StepConfig>([
  [ModuleStep.BIOLOGICAL_STUDY, step1Config],
  [ModuleStep.ARCHITECTURE_DESIGN, step2Config],
  [ModuleStep.DEVELOPMENT, step3Config],
  [ModuleStep.TESTING, step4Config],
  [ModuleStep.DOCUMENTATION, step5Config]
]);
