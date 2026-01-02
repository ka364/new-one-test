/**
 * BioModuleFactory - Core Types
 *
 * Transforms the 5-step module building process into a live workflow
 * with state machine, quality gates, and training integration.
 */

/**
 * The 7 Bio-Organisms that inspire HaderOS modules
 */
export enum BioOrganism {
  MYCELIUM = 'mycelium', // Fungal networks - Resource distribution
  CORVID = 'corvid', // Crow intelligence - Learning from errors
  CHAMELEON = 'chameleon', // Adaptive coloring - Market adaptation
  CEPHALOPOD = 'cephalopod', // Octopus - Distributed decision making
  ARACHNID = 'arachnid', // Spider - Fraud detection
  ANT = 'ant', // Ant colony - Logistics optimization
  TARDIGRADE = 'tardigrade', // Water bear - Business continuity
}

/**
 * The 5 HADER Project Phases
 */
export enum HADERPhase {
  FOUNDATION = 1, // Infrastructure & Team Formation
  ECOMMERCE = 2, // E-commerce Platform & Smart Inventory
  CRM_AGENT = 3, // CRM & Intelligent Agent
  KEMET_MVP = 4, // KEMET Content & HaderOS MVP
  INTEGRATION_LAUNCH = 5, // Integration, Testing & Launch
}

/**
 * The 5 Module Building Steps
 */
export enum ModuleStep {
  BIOLOGICAL_STUDY = 1, // 1-2 weeks: Study organism behavior
  ARCHITECTURE_DESIGN = 2, // 1 week: Design system architecture
  DEVELOPMENT = 3, // 2-4 weeks: Implement the module
  TESTING = 4, // 1 week: Unit, integration, performance tests
  DOCUMENTATION = 5, // 3 days: Technical & user documentation
}

/**
 * Module Step Status
 */
export enum StepStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Deliverable for each step
 */
export interface Deliverable {
  id: string;
  name: string;
  description: string;
  required: boolean;
  fileType?: string; // e.g., "md", "pdf", "ts", "test.ts"
  submitted: boolean;
  filePath?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedReason?: string;
}

/**
 * Step Configuration
 */
export interface StepConfig {
  step: ModuleStep;
  title: string;
  description: string;
  estimatedDuration: string; // e.g., "1-2 weeks"
  deliverables: Deliverable[];
  qualityGates: QualityGate[];
  trainingMaterials: TrainingMaterial[];
}

/**
 * Quality Gate - Automated checks before advancing to next step
 */
export interface QualityGate {
  id: string;
  name: string;
  description: string;
  check: (module: ModuleState) => Promise<QualityCheckResult>;
  blocking: boolean; // If true, must pass to advance
}

/**
 * Quality Check Result
 */
export interface QualityCheckResult {
  passed: boolean;
  message: string;
  details?: Record<string, any>;
}

/**
 * Training Material for each step
 */
export interface TrainingMaterial {
  id: string;
  title: string;
  type: 'article' | 'video' | 'code' | 'interactive';
  url?: string;
  content?: string;
  organism?: BioOrganism; // Related bio-organism
}

/**
 * Bio-Module Definition
 * Based on the biological organism it mimics
 */
export interface BioModule {
  // Identity
  name: string; // e.g., "mycelium"
  displayName: string; // e.g., "Mycelium Module"
  organism: BioOrganism;

  // Biological Inspiration
  behavior: string; // Natural behavior description
  adminProblem: string; // Business problem it solves
  solutionCode: string; // Code snippet example

  // Project Integration
  lifecyclePhase: HADERPhase; // Which HADER phase it belongs to
  priority: number; // 1-7 (build order)

  // Technology Stack
  technologies: string[]; // e.g., ["TypeScript", "Redis", "Kafka"]
  dependencies: string[]; // Other modules it depends on

  // References
  references: {
    papers?: string[]; // Academic papers
    books?: string[]; // Books
    videos?: string[]; // Educational videos
  };
}

/**
 * Module State - Tracks progress through the 5 steps
 */
export interface ModuleState {
  // Identity
  moduleName: string;
  organism: BioOrganism;

  // Progress
  currentStep: ModuleStep;
  stepStatuses: Record<ModuleStep, StepStatus>;
  completedSteps: ModuleStep[];

  // Deliverables
  deliverables: Record<string, Deliverable>;

  // Timeline
  startDate: Date;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  stepStartDates: Record<ModuleStep, Date>;
  stepCompletionDates: Partial<Record<ModuleStep, Date>>;

  // Team
  assignedDevelopers: string[];
  reviewer?: string;

  // Quality
  qualityChecksPassed: string[]; // IDs of passed quality gates
  qualityChecksFailed: string[]; // IDs of failed quality gates

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Module Submission - When developer submits deliverables
 */
export interface ModuleSubmission {
  moduleName: string;
  step: ModuleStep;
  deliverableId: string;
  filePath: string;
  notes?: string;
  submittedBy: string;
  submittedAt: Date;
}

/**
 * Module Review - When reviewer approves/rejects
 */
export interface ModuleReview {
  moduleName: string;
  step: ModuleStep;
  deliverableId: string;
  approved: boolean;
  feedback: string;
  reviewedBy: string;
  reviewedAt: Date;
}

/**
 * Training Session - Interactive learning
 */
export interface TrainingSession {
  id: string;
  userId: string;
  organism: BioOrganism;
  materialId: string;
  startedAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
  notes?: string;
}

/**
 * Module Statistics
 */
export interface ModuleStats {
  moduleName: string;
  totalDuration: number; // Days
  stepDurations: Record<ModuleStep, number>;
  deliverableCompletionRate: number; // 0-100
  qualityGatePassRate: number; // 0-100
  teamSize: number;
  linesOfCode: number;
  testCoverage: number; // 0-100
  documentationPages: number;
}

/**
 * Factory Configuration
 */
export interface FactoryConfig {
  // Quality Requirements
  minTestCoverage: number; // Default: 80%
  minDocumentationPages: number; // Default: 3
  requireCodeReview: boolean; // Default: true

  // Workflow
  autoAdvanceOnApproval: boolean; // Default: false
  allowSkipSteps: boolean; // Default: false

  // Notifications
  notifyOnSubmission: boolean; // Default: true
  notifyOnReview: boolean; // Default: true
  notifyOnQualityGateFail: boolean; // Default: true
}

/**
 * CLI Command Result
 */
export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}
