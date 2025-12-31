/**
 * AI Task Orchestrator
 * Manages and distributes tasks across multiple AI providers
 */

import { AIClient, AIProvider, AIMessage } from './ai-client';

export interface Task {
  id: string;
  type: 'code-review' | 'test-generation' | 'security-audit' | 'performance-analysis';
  input: string;
  priority: 'low' | 'medium' | 'high';
  preferredProvider?: AIProvider;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  output?: string;
  error?: string;
  provider: AIProvider;
  duration: number;
}

export class AIOrchestrator {
  private aiClient: AIClient;
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Promise<TaskResult>> = new Map();

  constructor() {
    this.aiClient = new AIClient();
  }

  /**
   * Add a task to the queue
   */
  addTask(task: Task): void {
    this.taskQueue.push(task);
  }

  /**
   * Execute a single task
   */
  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Select provider
      const provider = task.preferredProvider || this.aiClient.getBestProvider();

      // Get system prompt based on task type
      const systemPrompt = this.getSystemPrompt(task.type);

      // Execute AI request
      const response = await this.aiClient.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: task.input },
        ],
        provider,
        {
          temperature: 0.3, // Lower temperature for more consistent results
          maxTokens: 4000,
        }
      );

      return {
        taskId: task.id,
        success: true,
        output: response.content,
        provider: response.provider,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: task.preferredProvider || 'unknown',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute multiple tasks in parallel
   */
  async executeTasks(tasks: Task[]): Promise<TaskResult[]> {
    const promises = tasks.map(task => this.executeTask(task));
    return Promise.all(promises);
  }

  /**
   * Process the task queue
   */
  async processQueue(maxConcurrent: number = 3): Promise<TaskResult[]> {
    const results: TaskResult[] = [];

    while (this.taskQueue.length > 0) {
      // Take up to maxConcurrent tasks
      const batch = this.taskQueue.splice(0, maxConcurrent);
      
      // Execute batch
      const batchResults = await this.executeTasks(batch);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get system prompt based on task type
   */
  private getSystemPrompt(taskType: Task['type']): string {
    switch (taskType) {
      case 'code-review':
        return `You are an expert code reviewer. Analyze the provided code and:
1. Identify potential bugs and issues
2. Suggest improvements for code quality
3. Check for security vulnerabilities
4. Recommend best practices
5. Provide specific, actionable feedback

Format your response as a structured report with:
- Summary
- Issues Found (with severity: critical/high/medium/low)
- Recommendations
- Code Examples (if applicable)`;

      case 'test-generation':
        return `You are an expert test engineer. Generate comprehensive tests for the provided code:
1. Analyze the code structure and functionality
2. Generate unit tests covering all functions
3. Include edge cases and error scenarios
4. Use Vitest framework
5. Follow testing best practices

Format your response as:
- Test file with complete, runnable code
- Coverage analysis
- Test scenarios explained`;

      case 'security-audit':
        return `You are a security expert. Perform a thorough security audit of the provided code:
1. Check for OWASP Top 10 vulnerabilities
2. Identify authentication/authorization issues
3. Check for injection vulnerabilities
4. Review data validation and sanitization
5. Assess encryption and secure communication

Format your response as:
- Security Rating (A-F)
- Critical Issues
- Recommendations with priority
- Code fixes (if applicable)`;

      case 'performance-analysis':
        return `You are a performance optimization expert. Analyze the provided code for performance:
1. Identify performance bottlenecks
2. Check database query efficiency
3. Analyze algorithm complexity
4. Review caching opportunities
5. Suggest optimization strategies

Format your response as:
- Performance Score (1-10)
- Bottlenecks Identified
- Optimization Recommendations
- Expected Improvements
- Code Examples`;

      default:
        return 'You are a helpful AI assistant.';
    }
  }

  /**
   * Get available AI providers
   */
  getAvailableProviders(): AIProvider[] {
    return this.aiClient.getAvailableProviders();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      queuedTasks: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      availableProviders: this.aiClient.getAvailableProviders(),
    };
  }
}
