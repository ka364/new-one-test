  name: string;
  enableLogging?: boolean;
  enableMetrics?: boolean;
  logLevel?: "debug" | "info" | "warn" | "error";
}

/**
 * Abstract Base Bio Module
 */
export abstract class BaseBioModule extends EventEmitter {
  protected readonly moduleName: string;
  protected readonly enableLogging: boolean;
  protected readonly enableMetrics: boolean;
  protected readonly logLevel: "debug" | "info" | "warn" | "error";
  
  private metrics: ModuleMetrics = {
    totalEvents: 0,
    totalErrors: 0,
    totalProcessed: 0,
    averageProcessingTime: 0,
    lastActivityTimestamp: Date.now(),
  };
  
  private processingTimes: number[] = [];

  constructor(config: ModuleConfig) {
    super();
    this.moduleName = config.name;
    this.enableLogging = config.enableLogging ?? true;
    this.enableMetrics = config.enableMetrics ?? true;
    this.logLevel = config.logLevel ?? "info";
  }

  /**
   * Initialize the module
   * Override this in child classes for custom initialization
   */
  protected async initialize(): Promise<void> {
    this.logInfo(`Initializing ${this.moduleName}...`);
  }

  /**
   * Register event handlers
   */
  protected registerEventHandlers(handlers: EventHandlerMap): void {
    for (const [eventName, handler] of Object.entries(handlers)) {
      this.on(eventName, async (...args: any[]) => {
        try {
          await handler(...args);
          this.trackMetric("event_handled", eventName);