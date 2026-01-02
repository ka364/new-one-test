/**
 * CLI Handler for BioModuleFactory
 *
 * Provides command-line interface for managing bio-module development workflow.
 *
 * Commands:
 * - haderos module init <name>
 * - haderos module step <name> <step>
 * - haderos module submit <name> <step> --file <path>
 * - haderos module status <name>
 * - haderos module list
 * - haderos module validate <name>
 */

import { BioModuleFactory } from './factory';
import { bioModuleDefinitions } from './bio-modules';
import { BioOrganism, ModuleStep } from './types';

export class BioModuleCLI {
  private factory: BioModuleFactory;

  constructor() {
    this.factory = new BioModuleFactory();
  }

  /**
   * Initialize a new bio-module
   * Usage: haderos module init mycelium
   */
  async init(moduleName: string): Promise<void> {
    try {
      // Find module definition
      const organism = moduleName.toLowerCase() as BioOrganism;
      const definition = bioModuleDefinitions.get(organism);

      if (!definition) {
        console.error(`❌ Unknown module: ${moduleName}`);
        console.log(`\n📋 Available modules:`);
        this.listModules();
        return;
      }

      // Initialize module
      await this.factory.initializeModule(definition);

      console.log(`✅ Module initialized: ${definition.displayName}`);
      console.log(`\n📖 Biological Behavior:`);
      console.log(definition.behavior);
      console.log(`\n🎯 Admin Problem:`);
      console.log(definition.adminProblem);
      console.log(`\n📁 Created structure:`);
      console.log(`   modules/${moduleName}/`);
      console.log(`   ├── docs/`);
      console.log(`   │   ├── step1_bio-study.md`);
      console.log(`   │   ├── step2_architecture.md`);
      console.log(`   │   ├── step3_development.md`);
      console.log(`   │   ├── step4_testing.md`);
      console.log(`   │   └── step5_documentation.md`);
      console.log(`   ├── src/`);
      console.log(`   ├── tests/`);
      console.log(`   └── README.md`);
      console.log(`\n🚀 Next step: haderos module step ${moduleName} 1`);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Show step requirements and start work on a step
   * Usage: haderos module step mycelium 1
   */
  async step(moduleName: string, stepNumber: number): Promise<void> {
    try {
      const state = await this.factory.getModuleState(moduleName);

      if (!state) {
        console.error(`❌ Module not found: ${moduleName}`);
        console.log(`💡 Hint: Run 'haderos module init ${moduleName}' first`);
        return;
      }

      const step = stepNumber as ModuleStep;
      const config = await this.factory.getStepConfig(step);

      if (!config) {
        console.error(`❌ Invalid step: ${stepNumber}`);
        return;
      }

      console.log(`\n📋 Step ${stepNumber}: ${config.title}`);
      console.log(`⏱️  Estimated Duration: ${config.estimatedDuration}`);
      console.log(`\n📝 Description:`);
      console.log(config.description);

      console.log(`\n📦 Required Deliverables:`);
      for (const deliverable of config.deliverables) {
        const status = deliverable.submitted ? '✅' : '⏳';
        const required = deliverable.required ? '(required)' : '(optional)';
        console.log(`   ${status} ${deliverable.name} ${required}`);
        console.log(`      ${deliverable.description}`);
      }

      console.log(`\n🚦 Quality Gates:`);
      for (const gate of config.qualityGates) {
        const blocking = gate.blocking ? '🔴 BLOCKING' : '🟡 WARNING';
        console.log(`   ${blocking} ${gate.name}`);
        console.log(`      ${gate.description}`);
      }

      console.log(`\n📚 Training Materials:`);
      if (config.trainingMaterials.length > 0) {
        for (const material of config.trainingMaterials) {
          console.log(`   📖 ${material.title} (${material.type})`);
        }
      } else {
        console.log(`   (No training materials for this step)`);
      }

      console.log(`\n🎯 Next Action:`);
      console.log(`   1. Complete the deliverables`);
      console.log(`   2. Submit: haderos module submit ${moduleName} ${stepNumber} --file <path>`);
      console.log(`   3. Validate: haderos module validate ${moduleName}`);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Submit a deliverable for a step
   * Usage: haderos module submit mycelium 1 --file docs/bio-study.md
   */
  async submit(moduleName: string, stepNumber: number, filePath: string): Promise<void> {
    try {
      const step = stepNumber as ModuleStep;

      // Submit deliverable
      await this.factory.submitDeliverable(moduleName, step, filePath);

      console.log(`✅ Deliverable submitted: ${filePath}`);

      // Check if step is complete
      const state = await this.factory.getModuleState(moduleName);
      if (!state) return;

      const config = await this.factory.getStepConfig(step);
      if (!config) return;

      const requiredDeliverables = config.deliverables.filter((d) => d.required);
      const submittedRequired = requiredDeliverables.filter(
        (d) => state.deliverables[d.id]?.submitted
      );

      console.log(
        `\n📊 Progress: ${submittedRequired.length}/${requiredDeliverables.length} required deliverables`
      );

      if (submittedRequired.length === requiredDeliverables.length) {
        console.log(`\n✅ All required deliverables submitted!`);
        console.log(`🚀 Next: haderos module validate ${moduleName}`);
      } else {
        console.log(`\n⏳ Still needed:`);
        for (const deliverable of requiredDeliverables) {
          if (!state.deliverables[deliverable.id]?.submitted) {
            console.log(`   ⏳ ${deliverable.name}`);
          }
        }
      }
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  /**
   * Show module status
   * Usage: haderos module status mycelium
   */
  async status(moduleName: string): Promise<void> {
    try {
      const state = await this.factory.getModuleState(moduleName);

      if (!state) {
        console.error(`❌ Module not found: ${moduleName}`);
        return;
      }

      const organism = moduleName.toLowerCase() as BioOrganism;
      const definition = bioModuleDefinitions.get(organism);

      console.log(`\n📊 Module Status: ${definition?.displayName || moduleName}`);
      console.log(`\n🔄 Current Step: ${state.currentStep}`);
      console.log(`✅ Completed Steps: ${state.completedSteps.join(', ') || 'None'}`);
      console.log(`📅 Started: ${state.startDate.toLocaleDateString()}`);

      const daysSinceStart = Math.floor(
        (Date.now() - state.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log(`⏱️  Days in Progress: ${daysSinceStart}`);

      console.log(`\n📦 Deliverables:`);
      for (const [id, deliverable] of Object.entries(state.deliverables)) {
        const status = deliverable.submitted ? '✅' : '⏳';
        console.log(`   ${status} ${id}`);
        if (deliverable.filePath) {
          console.log(`      📁 ${deliverable.filePath}`);
        }
      }

      console.log(`\n🎯 Next Action:`);
      console.log(`   haderos module step ${moduleName} ${state.currentStep}`);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  /**
   * List all available modules
   * Usage: haderos module list
   */
  listModules(): void {
    console.log(`\n📚 Available Bio-Modules:\n`);

    for (const [organism, module] of bioModuleDefinitions) {
      console.log(`${module.priority}. ${module.displayName} (${organism})`);
      console.log(`   🎯 Problem: ${module.adminProblem.split('\n')[0]}`);
      console.log(`   📍 Phase: ${module.lifecyclePhase}`);
      console.log(`   🔧 Tech: ${module.technologies.slice(0, 3).join(', ')}`);
      if (module.dependencies.length > 0) {
        console.log(`   ⚠️  Depends on: ${module.dependencies.join(', ')}`);
      }
      console.log();
    }

    console.log(`💡 To start: haderos module init <name>`);
  }

  /**
   * Validate module and run quality gates
   * Usage: haderos module validate mycelium
   */
  async validate(moduleName: string): Promise<void> {
    try {
      console.log(`\n🔍 Validating module: ${moduleName}...\n`);

      const result = await this.factory.validateStep(moduleName);

      if (result.passed) {
        console.log(`✅ All quality gates passed!`);
        console.log(`\n🎉 Step complete! Advancing to next step...`);

        const state = await this.factory.getModuleState(moduleName);
        if (state) {
          console.log(`\n🚀 Current Step: ${state.currentStep}`);
          console.log(`💡 Next: haderos module step ${moduleName} ${state.currentStep}`);
        }
      } else {
        console.log(`❌ Validation failed!\n`);
        console.log(`📋 Issues:`);
        for (const gate of result.failedGates) {
          console.log(`   🔴 ${gate.name}`);
          console.log(`      ${gate.message}`);
          if (gate.details) {
            console.log(`      Details: ${JSON.stringify(gate.details, null, 2)}`);
          }
        }

        console.log(`\n💡 Fix the issues above and run validation again.`);
      }
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
}

/**
 * Main CLI entry point
 */
export async function runCLI(args: string[]): Promise<void> {
  const cli = new BioModuleCLI();

  const command = args[0];
  const subcommand = args[1];

  if (command !== 'module') {
    console.error(`❌ Unknown command: ${command}`);
    console.log(`💡 Usage: haderos module <subcommand>`);
    return;
  }

  switch (subcommand) {
    case 'init':
      await cli.init(args[2]);
      break;

    case 'step':
      await cli.step(args[2], parseInt(args[3]));
      break;

    case 'submit':
      const fileIndex = args.indexOf('--file');
      if (fileIndex === -1) {
        console.error(`❌ Missing --file argument`);
        return;
      }
      await cli.submit(args[2], parseInt(args[3]), args[fileIndex + 1]);
      break;

    case 'status':
      await cli.status(args[2]);
      break;

    case 'list':
      cli.listModules();
      break;

    case 'validate':
      await cli.validate(args[2]);
      break;

    default:
      console.error(`❌ Unknown subcommand: ${subcommand}`);
      console.log(`\n📖 Available commands:`);
      console.log(`   haderos module init <name>`);
      console.log(`   haderos module step <name> <step>`);
      console.log(`   haderos module submit <name> <step> --file <path>`);
      console.log(`   haderos module status <name>`);
      console.log(`   haderos module list`);
      console.log(`   haderos module validate <name>`);
  }
}
