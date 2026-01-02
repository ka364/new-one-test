/**
 * Training Academy
 *
 * Interactive training system that teaches developers the biological principles
 * behind each module through lessons, exercises, and code challenges.
 *
 * Inspired by: "The system doesn't just document - it teaches."
 */

import { BioOrganism, TrainingMaterial, LessonProgress } from './types';
import { bioModuleDefinitions } from './bio-modules';

export interface Lesson {
  id: string;
  title: string;
  organism: BioOrganism;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  objectives: string[];
  content: LessonContent[];
  exercises: Exercise[];
  quiz?: Quiz;
}

export interface LessonContent {
  type: 'text' | 'code' | 'video' | 'diagram';
  content: string;
  language?: string; // For code blocks
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  starterCode?: string;
  solution?: string;
  tests: ExerciseTest[];
}

export interface ExerciseTest {
  description: string;
  test: (code: string) => Promise<boolean>;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

/**
 * Training Academy System
 */
export class TrainingAcademy {
  private lessons: Map<string, Lesson>;
  private progress: Map<string, LessonProgress>; // userId -> progress

  constructor() {
    this.lessons = new Map();
    this.progress = new Map();
    this.initializeLessons();
  }

  /**
   * Initialize all training lessons
   */
  private initializeLessons() {
    // Lesson 1: From Mechanics to Life
    this.lessons.set('lesson_01', {
      id: 'lesson_01',
      title: 'From Mechanics to Life: The Organic Singularity',
      organism: BioOrganism.MYCELIUM,
      duration: '30 minutes',
      difficulty: 'beginner',
      objectives: [
        'Understand the shift from mechanical automation to organic governance',
        'Learn the 5 principles of organic governance',
        'Recognize the limitations of traditional SaaS',
      ],
      content: [
        {
          type: 'text',
          content: `
# From Mechanics to Life

Traditional software systems are **mechanical**: rigid, centralized, and fragile.
Biological systems are **organic**: adaptive, distributed, and resilient.

HaderOS bridges this gap by applying biological principles to business software.

## The 5 Principles of Organic Governance:

1. **Digital Homeostasis** - Self-regulating systems that maintain balance
2. **Diplomatic Adaptation** - Flexible response to changing conditions
3. **Genetic Memory** - Learning from past experiences
4. **Self-Healing** - Automatic recovery from failures
5. **Continuous Evolution** - Constant improvement without disruption
          `,
        },
        {
          type: 'code',
          language: 'typescript',
          content: `
// Traditional (Mechanical) Approach
if (inventory < threshold) {
  sendAlert("Low inventory!");
}

// Organic (HaderOS) Approach
class InventoryHomeostasis {
  async maintain() {
    const state = await this.getCurrentState();
    const optimal = await this.calculateOptimal();
    const deviation = optimal - state.current;
    
    if (deviation > this.tolerance) {
      // Self-regulate: automatically rebalance
      await this.rebalance(deviation);
      
      // Learn: update optimal threshold based on patterns
      await this.updateOptimal(state.patterns);
    }
  }
}
          `,
        },
      ],
      exercises: [
        {
          id: 'ex_01_homeostasis',
          title: 'Implement Digital Homeostasis',
          description: 'Create a self-regulating system that maintains optimal inventory levels',
          starterCode: `
class InventorySystem {
  async checkInventory(productId: string) {
    // TODO: Implement self-regulating logic
  }
}
          `,
          solution: `
class InventorySystem {
  private optimal = 100;
  private tolerance = 10;
  
  async checkInventory(productId: string) {
    const current = await this.getCurrentLevel(productId);
    const deviation = this.optimal - current;
    
    if (Math.abs(deviation) > this.tolerance) {
      await this.rebalance(productId, deviation);
    }
  }
  
  private async rebalance(productId: string, amount: number) {
    if (amount > 0) {
      await this.orderMore(productId, amount);
    } else {
      await this.redistributeExcess(productId, Math.abs(amount));
    }
  }
}
          `,
          tests: [],
        },
      ],
      quiz: {
        questions: [
          {
            question: 'What is Digital Homeostasis?',
            options: [
              'A database backup strategy',
              'Self-regulating systems that maintain balance',
              'A type of cloud hosting',
              'An API authentication method',
            ],
            correctAnswer: 1,
            explanation:
              'Digital Homeostasis is the ability of a system to self-regulate and maintain optimal balance, inspired by biological homeostasis.',
          },
        ],
      },
    });

    // Lesson 2: Mycelium - Fungal Networks
    this.lessons.set('lesson_02', {
      id: 'lesson_02',
      title: 'Mycelium: The Wood Wide Web',
      organism: BioOrganism.MYCELIUM,
      duration: '45 minutes',
      difficulty: 'intermediate',
      objectives: [
        'Understand how fungal networks distribute resources',
        'Learn to implement decentralized resource allocation',
        'Build a mycelium-inspired inventory balancing system',
      ],
      content: [
        {
          type: 'text',
          content: `
# The Mycelium Network

In forests, trees are connected by vast underground fungal networks called **mycelium**.
These networks:
- Transfer water, sugars, and minerals between trees
- Move resources from abundant areas to areas of need
- Warn other trees of dangers through chemical signals
- Create decentralized, resilient networks without central control

## Business Application

In multi-branch organizations:
- Branch A has excess inventory while Branch B faces stockouts
- Resources are wasted due to poor distribution
- Manual rebalancing is slow and inefficient

**Mycelium Module** solves this by creating a decentralized resource distribution network.
          `,
        },
        {
          type: 'code',
          language: 'typescript',
          content: `
// Mycelium-Inspired Resource Distribution
class MyceliumNetwork {
  async balanceResources() {
    const nodes = await this.getAllNodes(); // Branches
    
    for (const node of nodes) {
      if (node.surplus > 0) {
        const needyNeighbors = await this.findNearbyNeeds(node);
        
        for (const neighbor of needyNeighbors) {
          const amount = Math.min(node.surplus, neighbor.deficit);
          
          if (await this.isCostEffective(node, neighbor, amount)) {
            await this.transfer(node, neighbor, amount);
            node.surplus -= amount;
            neighbor.deficit -= amount;
          }
        }
      }
    }
  }
  
  private async isCostEffective(
    from: Node,
    to: Node,
    amount: number
  ): Promise<boolean> {
    const transferCost = this.calculateTransferCost(from, to, amount);
    const opportunityCost = this.calculateOpportunityCost(to, amount);
    return transferCost < opportunityCost;
  }
}
          `,
        },
      ],
      exercises: [
        {
          id: 'ex_02_mycelium',
          title: 'Build Mycelium Network',
          description:
            'Implement a resource distribution algorithm that balances inventory across branches',
          starterCode: `
interface Branch {
  id: string;
  inventory: number;
  optimal: number;
  location: { lat: number; lng: number };
}

class MyceliumBalancer {
  async balance(branches: Branch[]) {
    // TODO: Implement mycelium-inspired balancing
  }
}
          `,
          tests: [],
        },
      ],
    });

    // Lesson 3: Corvid - Crow Intelligence
    this.lessons.set('lesson_03', {
      id: 'lesson_03',
      title: 'Corvid: Learning from Mistakes',
      organism: BioOrganism.CORVID,
      duration: '40 minutes',
      difficulty: 'intermediate',
      objectives: [
        'Understand how crows learn and remember',
        'Implement error pattern recognition',
        'Build a system that prevents repeated mistakes',
      ],
      content: [
        {
          type: 'text',
          content: `
# Corvid Intelligence

Crows are among the most intelligent animals:
- Learn from mistakes and remember solutions
- Use tools to solve complex problems
- Teach other crows successful strategies
- Recognize individual humans and remember interactions
- Adapt behavior based on past experiences

## Business Application

Systems repeat the same errors:
- Data conflicts from multiple sources
- No learning from past mistakes
- Manual error correction is repetitive
- Knowledge is lost when employees leave

**Corvid Module** solves this by implementing meta-learning and error prevention.
          `,
        },
        {
          type: 'code',
          language: 'typescript',
          content: `
// Corvid-Inspired Learning Engine
class CorvidLearningEngine {
  private errorMemory: ErrorMemory;
  private preventionRules: RuleEngine;
  
  async recordError(error: Error, context: Context) {
    // Extract pattern from error
    const pattern = this.extractPattern(error);
    
    // Store in memory
    await this.errorMemory.store({
      pattern,
      context,
      timestamp: new Date(),
      frequency: await this.getErrorFrequency(pattern)
    });
    
    // Generate prevention rule
    const rule = await this.generateRule(pattern, context);
    await this.preventionRules.add(rule);
    
    // Share knowledge with other agents
    await this.broadcastLearning(pattern, rule);
  }
  
  async preventError(operation: Operation) {
    // Check against learned rules
    const violations = await this.preventionRules.check(operation);
    
    if (violations.length > 0) {
      throw new PreventableError({
        message: "This operation matches a known error pattern",
        violations,
        suggestion: await this.getSuggestion(violations)
      });
    }
  }
}
          `,
        },
      ],
      exercises: [],
    });

    // More lessons would be added here...
  }

  /**
   * Get a lesson by ID
   */
  getLesson(lessonId: string): Lesson | undefined {
    return this.lessons.get(lessonId);
  }

  /**
   * Get all lessons for an organism
   */
  getLessonsForOrganism(organism: BioOrganism): Lesson[] {
    return Array.from(this.lessons.values()).filter((lesson) => lesson.organism === organism);
  }

  /**
   * Get all available lessons
   */
  getAllLessons(): Lesson[] {
    return Array.from(this.lessons.values());
  }

  /**
   * Start a lesson for a user
   */
  async startLesson(userId: string, lessonId: string): Promise<void> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) {
      throw new Error(`Lesson not found: ${lessonId}`);
    }

    this.progress.set(`${userId}:${lessonId}`, {
      lessonId,
      userId,
      startedAt: new Date(),
      completedSections: [],
      completedExercises: [],
      quizScore: undefined,
      completed: false,
    });
  }

  /**
   * Complete a section of a lesson
   */
  async completeSection(userId: string, lessonId: string, sectionIndex: number): Promise<void> {
    const key = `${userId}:${lessonId}`;
    const progress = this.progress.get(key);

    if (!progress) {
      throw new Error('Lesson not started');
    }

    if (!progress.completedSections.includes(sectionIndex)) {
      progress.completedSections.push(sectionIndex);
    }
  }

  /**
   * Submit an exercise solution
   */
  async submitExercise(
    userId: string,
    lessonId: string,
    exerciseId: string,
    code: string
  ): Promise<{ passed: boolean; feedback: string }> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const exercise = lesson.exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) {
      throw new Error('Exercise not found');
    }

    // Run tests
    const results = await Promise.all(exercise.tests.map((test) => test.test(code)));

    const passed = results.every((r) => r);

    if (passed) {
      const key = `${userId}:${lessonId}`;
      const progress = this.progress.get(key);
      if (progress && !progress.completedExercises.includes(exerciseId)) {
        progress.completedExercises.push(exerciseId);
      }
    }

    return {
      passed,
      feedback: passed
        ? '✅ All tests passed! Great work!'
        : '❌ Some tests failed. Review the requirements and try again.',
    };
  }

  /**
   * Submit quiz answers
   */
  async submitQuiz(
    userId: string,
    lessonId: string,
    answers: number[]
  ): Promise<{ score: number; passed: boolean; feedback: string[] }> {
    const lesson = this.lessons.get(lessonId);
    if (!lesson || !lesson.quiz) {
      throw new Error('Quiz not found');
    }

    const questions = lesson.quiz.questions;
    let correct = 0;
    const feedback: string[] = [];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const userAnswer = answers[i];

      if (userAnswer === question.correctAnswer) {
        correct++;
        feedback.push(`✅ Correct! ${question.explanation}`);
      } else {
        feedback.push(`❌ Incorrect. ${question.explanation}`);
      }
    }

    const score = (correct / questions.length) * 100;
    const passed = score >= 70;

    const key = `${userId}:${lessonId}`;
    const progress = this.progress.get(key);
    if (progress) {
      progress.quizScore = score;

      // Mark lesson as completed if quiz passed
      if (passed) {
        progress.completed = true;
        progress.completedAt = new Date();
      }
    }

    return { score, passed, feedback };
  }

  /**
   * Get user's progress for a lesson
   */
  getProgress(userId: string, lessonId: string): LessonProgress | undefined {
    return this.progress.get(`${userId}:${lessonId}`);
  }

  /**
   * Get all progress for a user
   */
  getUserProgress(userId: string): LessonProgress[] {
    return Array.from(this.progress.values()).filter((p) => p.userId === userId);
  }
}

/**
 * Error Memory System
 */
class ErrorMemory {
  private errors: Map<string, ErrorRecord[]> = new Map();

  async store(record: ErrorRecord) {
    const key = record.pattern;
    const existing = this.errors.get(key) || [];
    existing.push(record);
    this.errors.set(key, existing);
  }

  async getErrorFrequency(pattern: string): Promise<number> {
    const records = this.errors.get(pattern) || [];
    return records.length;
  }
}

interface ErrorRecord {
  pattern: string;
  context: any;
  timestamp: Date;
  frequency: number;
}
