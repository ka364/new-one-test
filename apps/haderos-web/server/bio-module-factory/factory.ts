/**
 * BioModuleFactory - State Machine
 * 
 * Manages the lifecycle of bio-modules through the 5-step process.
 * Enforces quality gates, tracks deliverables, and prevents invalid transitions.
 */

import {
  BioModule,
  BioOrganism,
  ModuleState,
  ModuleStep,
  StepStatus,
  ModuleSubmission,
  ModuleReview,
  Deliverable,
  QualityGate,
  QualityCheckResult,
  FactoryConfig,
  CommandResult,
  HADERPhase,
  StepConfig
} from "./types";
import { stepConfigurations } from "./step-configs";
import { bioModuleDefinitions } from "./bio-modules";

/**
 * BioModuleFactory - Main State Machine
 */
export class BioModuleFactory {
  private modules: Map<string, ModuleState> = new Map();
  private config: FactoryConfig;

  constructor(config?: Partial<FactoryConfig>) {
    this.config = {
      minTestCoverage: 80,
      minDocumentationPages: 3,
      requireCodeReview: true,
      autoAdvanceOnApproval: false,
      allowSkipSteps: false,
      notifyOnSubmission: true,
      notifyOnReview: true,
      notifyOnQualityGateFail: true,
      ...config
    };
  }

  /**
   * Initialize a new module
   */
  async initModule(
    moduleName: string,
    organism: BioOrganism,
    assignedDevelopers: string[],
    createdBy: string
  ): Promise<CommandResult> {
    // Check if module already exists
    if (this.modules.has(moduleName)) {
      return {
        success: false,
        message: `Module "${moduleName}" already exists`,
        errors: ["Module already initialized"]
      };
    }

    // Validate organism
    const bioModule = bioModuleDefinitions.get(organism);
    if (!bioModule) {
      return {
        success: false,
        message: `Unknown organism: ${organism}`,
        errors: ["Invalid bio-organism"]
      };
    }

    // Create initial state
    const now = new Date();
    const initialState: ModuleState = {
      moduleName,
      organism,
      currentStep: ModuleStep.BIOLOGICAL_STUDY,
      stepStatuses: {
        [ModuleStep.BIOLOGICAL_STUDY]: StepStatus.IN_PROGRESS,
        [ModuleStep.ARCHITECTURE_DESIGN]: StepStatus.NOT_STARTED,
        [ModuleStep.DEVELOPMENT]: StepStatus.NOT_STARTED,
        [ModuleStep.TESTING]: StepStatus.NOT_STARTED,
        [ModuleStep.DOCUMENTATION]: StepStatus.NOT_STARTED
      },
      completedSteps: [],
      deliverables: {},
      startDate: now,
      stepStartDates: {
        [ModuleStep.BIOLOGICAL_STUDY]: now
      },
      stepCompletionDates: {},
      assignedDevelopers,
      qualityChecksPassed: [],
      qualityChecksFailed: [],
      createdAt: now,
      updatedAt: now,
      createdBy
    };

    // Initialize deliverables for step 1
    const step1Config = stepConfigurations.get(ModuleStep.BIOLOGICAL_STUDY)!;
    for (const deliverable of step1Config.deliverables) {
      initialState.deliverables[deliverable.id] = { ...deliverable };
    }

    this.modules.set(moduleName, initialState);

    // Create module directory structure
    await this.createModuleStructure(moduleName, organism);

    return {
      success: true,
      message: `Module "${moduleName}" initialized successfully`,
      data: {
        moduleName,
        organism,
        currentStep: ModuleStep.BIOLOGICAL_STUDY,
        bioModule
      }
    };
  }

  /**
   * Get current module state
   */
  getModuleState(moduleName: string): ModuleState | undefined {
    return this.modules.get(moduleName);
  }

  /**
   * Submit a deliverable for the current step
   */
  async submitDeliverable(
    submission: ModuleSubmission
  ): Promise<CommandResult> {
    const state = this.modules.get(submission.moduleName);
    if (!state) {
      return {
        success: false,
        message: `Module "${submission.moduleName}" not found`,
        errors: ["Module not initialized"]
      };
    }

    // Check if step matches current step
    if (state.currentStep !== submission.step) {
      return {
        success: false,
        message: `Cannot submit for step ${submission.step}. Current step is ${state.currentStep}`,
        errors: ["Step mismatch"]
      };
    }

    // Check if deliverable exists
    const deliverable = state.deliverables[submission.deliverableId];
    if (!deliverable) {
      return {
        success: false,
        message: `Deliverable "${submission.deliverableId}" not found`,
        errors: ["Invalid deliverable ID"]
      };
    }

    // Mark as submitted
    deliverable.submitted = true;
    deliverable.filePath = submission.filePath;
    deliverable.submittedAt = submission.submittedAt;

    // Update step status
    state.stepStatuses[submission.step] = StepStatus.SUBMITTED;
    state.updatedAt = new Date();

    // Notify if configured
    if (this.config.notifyOnSubmission) {
      await this.notifySubmission(submission);
    }

    return {
      success: true,
      message: `Deliverable "${deliverable.name}" submitted successfully`,
      data: { deliverable }
    };
  }

  /**
   * Review a submitted deliverable
   */
  async reviewDeliverable(
    review: ModuleReview
  ): Promise<CommandResult> {
    const state = this.modules.get(review.moduleName);
    if (!state) {
      return {
        success: false,
        message: `Module "${review.moduleName}" not found`,
        errors: ["Module not initialized"]
      };
    }

    const deliverable = state.deliverables[review.deliverableId];
    if (!deliverable) {
      return {
        success: false,
        message: `Deliverable "${review.deliverableId}" not found`,
        errors: ["Invalid deliverable ID"]
      };
    }

    if (!deliverable.submitted) {
      return {
        success: false,
        message: `Deliverable "${deliverable.name}" has not been submitted yet`,
        errors: ["Deliverable not submitted"]
      };
    }

    if (review.approved) {
      deliverable.approvedAt = review.reviewedAt;
      state.reviewer = review.reviewedBy;
    } else {
      deliverable.rejectedReason = review.feedback;
      deliverable.submitted = false;
      deliverable.submittedAt = undefined;
    }

    state.updatedAt = new Date();

    // Notify if configured
    if (this.config.notifyOnReview) {
      await this.notifyReview(review);
    }

    // Check if all deliverables for current step are approved
    const stepConfig = stepConfigurations.get(state.currentStep)!;
    const allApproved = stepConfig.deliverables
      .filter(d => d.required)
      .every(d => state.deliverables[d.id].approvedAt);

    if (allApproved && this.config.autoAdvanceOnApproval) {
      return await this.advanceToNextStep(review.moduleName, review.reviewedBy);
    }

    return {
      success: true,
      message: review.approved 
        ? `Deliverable "${deliverable.name}" approved`
        : `Deliverable "${deliverable.name}" rejected`,
      data: { deliverable, allApproved }
    };
  }

  /**
   * Advance to the next step (with quality gates)
   */
  async advanceToNextStep(
    moduleName: string,
    advancedBy: string
  ): Promise<CommandResult> {
    const state = this.modules.get(moduleName);
    if (!state) {
      return {
        success: false,
        message: `Module "${moduleName}" not found`,
        errors: ["Module not initialized"]
      };
    }

    // Check if all required deliverables are approved
    const currentStepConfig = stepConfigurations.get(state.currentStep)!;
    const requiredDeliverables = currentStepConfig.deliverables.filter(d => d.required);
    const unapprovedDeliverables = requiredDeliverables.filter(
      d => !state.deliverables[d.id].approvedAt
    );

    if (unapprovedDeliverables.length > 0) {
      return {
        success: false,
        message: `Cannot advance: ${unapprovedDeliverables.length} required deliverable(s) not approved`,
        errors: unapprovedDeliverables.map(d => `"${d.name}" not approved`),
        data: { unapprovedDeliverables }
      };
    }

    // Run quality gates
    const qualityResults = await this.runQualityGates(state, currentStepConfig);
    const failedGates = qualityResults.filter(r => !r.result.passed && r.gate.blocking);

    if (failedGates.length > 0) {
      // Record failed gates
      failedGates.forEach(f => {
        if (!state.qualityChecksFailed.includes(f.gate.id)) {
          state.qualityChecksFailed.push(f.gate.id);
        }
      });

      if (this.config.notifyOnQualityGateFail) {
        await this.notifyQualityGateFail(moduleName, failedGates);
      }

      return {
        success: false,
        message: `Cannot advance: ${failedGates.length} quality gate(s) failed`,
        errors: failedGates.map(f => f.result.message),
        data: { failedGates }
      };
    }

    // Record passed gates
    qualityResults.forEach(r => {
      if (r.result.passed && !state.qualityChecksPassed.includes(r.gate.id)) {
        state.qualityChecksPassed.push(r.gate.id);
      }
    });

    // Mark current step as completed
    state.completedSteps.push(state.currentStep);
    state.stepStatuses[state.currentStep] = StepStatus.APPROVED;
    state.stepCompletionDates[state.currentStep] = new Date();

    // Check if this was the last step
    if (state.currentStep === ModuleStep.DOCUMENTATION) {
      state.actualCompletionDate = new Date();
      state.updatedAt = new Date();

      return {
        success: true,
        message: `🎉 Module "${moduleName}" completed! All 5 steps finished.`,
        data: {
          completedAt: state.actualCompletionDate,
          totalDuration: this.calculateDuration(state.startDate, state.actualCompletionDate)
        }
      };
    }

    // Advance to next step
    const nextStep = state.currentStep + 1 as ModuleStep;
    state.currentStep = nextStep;
    state.stepStatuses[nextStep] = StepStatus.IN_PROGRESS;
    state.stepStartDates[nextStep] = new Date();

    // Initialize deliverables for next step
    const nextStepConfig = stepConfigurations.get(nextStep)!;
    for (const deliverable of nextStepConfig.deliverables) {
      state.deliverables[deliverable.id] = { ...deliverable };
    }

    state.updatedAt = new Date();

    return {
      success: true,
      message: `Advanced to Step ${nextStep}: ${nextStepConfig.title}`,
      data: {
        currentStep: nextStep,
        stepConfig: nextStepConfig
      }
    };
  }

  /**
   * Get module status summary
   */
  getModuleStatus(moduleName: string): CommandResult {
    const state = this.modules.get(moduleName);
    if (!state) {
      return {
        success: false,
        message: `Module "${moduleName}" not found`,
        errors: ["Module not initialized"]
      };
    }

    const currentStepConfig = stepConfigurations.get(state.currentStep)!;
    const bioModule = bioModuleDefinitions.get(state.organism)!;

    // Calculate progress
    const totalSteps = 5;
    const completedSteps = state.completedSteps.length;
    const progress = (completedSteps / totalSteps) * 100;

    // Calculate deliverable completion
    const totalDeliverables = Object.keys(state.deliverables).length;
    const approvedDeliverables = Object.values(state.deliverables)
      .filter(d => d.approvedAt).length;
    const deliverableProgress = totalDeliverables > 0
      ? (approvedDeliverables / totalDeliverables) * 100
      : 0;

    // Calculate duration
    const durationDays = this.calculateDuration(
      state.startDate,
      state.actualCompletionDate || new Date()
    );

    return {
      success: true,
      message: `Module "${moduleName}" status`,
      data: {
        moduleName,
        organism: state.organism,
        bioModule,
        currentStep: state.currentStep,
        currentStepTitle: currentStepConfig.title,
        progress,
        completedSteps: state.completedSteps,
        totalSteps,
        deliverableProgress,
        approvedDeliverables,
        totalDeliverables,
        durationDays,
        assignedDevelopers: state.assignedDevelopers,
        reviewer: state.reviewer,
        stepStatuses: state.stepStatuses,
        qualityChecksPassed: state.qualityChecksPassed.length,
        qualityChecksFailed: state.qualityChecksFailed.length
      }
    };
  }

  /**
   * List all modules
   */
  listModules(): CommandResult {
    const modules = Array.from(this.modules.values()).map(state => ({
      moduleName: state.moduleName,
      organism: state.organism,
      currentStep: state.currentStep,
      progress: (state.completedSteps.length / 5) * 100,
      startDate: state.startDate,
      durationDays: this.calculateDuration(
        state.startDate,
        state.actualCompletionDate || new Date()
      )
    }));

    return {
      success: true,
      message: `Found ${modules.length} module(s)`,
      data: { modules }
    };
  }

  // Private helper methods

  private async runQualityGates(
    state: ModuleState,
    stepConfig: StepConfig
  ): Promise<Array<{ gate: QualityGate; result: QualityCheckResult }>> {
    const results: Array<{ gate: QualityGate; result: QualityCheckResult }> = [];

    for (const gate of stepConfig.qualityGates) {
      const result = await gate.check(state);
      results.push({ gate, result });
    }

    return results;
  }

  private async createModuleStructure(
    moduleName: string,
    organism: BioOrganism
  ): Promise<void> {
    // Create directory structure:
    // modules/{moduleName}/
    //   ├── docs/
    //   │   ├── step1_bio-study.md
    //   │   ├── step2_architecture.md
    //   │   ├── step3_development.md
    //   │   ├── step4_testing.md
    //   │   └── step5_documentation.md
    //   ├── src/
    //   ├── tests/
    //   └── README.md

    // This would be implemented with actual file system operations
    console.log(`[BioModuleFactory] Creating structure for ${moduleName} (${organism})`);
  }

  private calculateDuration(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)); // Days
  }

  private async notifySubmission(submission: ModuleSubmission): Promise<void> {
    console.log(`[BioModuleFactory] Deliverable submitted:`, submission);
    // Implement actual notification (email, Slack, etc.)
  }

  private async notifyReview(review: ModuleReview): Promise<void> {
    console.log(`[BioModuleFactory] Deliverable reviewed:`, review);
    // Implement actual notification
  }

  private async notifyQualityGateFail(
    moduleName: string,
    failedGates: Array<{ gate: QualityGate; result: QualityCheckResult }>
  ): Promise<void> {
    console.log(`[BioModuleFactory] Quality gates failed for ${moduleName}:`, failedGates);
    // Implement actual notification
  }
}

// Singleton instance
export const bioModuleFactory = new BioModuleFactory();
