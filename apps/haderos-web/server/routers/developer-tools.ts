// Developer Tools Router
// Provides APIs for developer tools, sandbox, code analysis, and debugging

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import * as crypto from "crypto";

// Audit log storage
const auditLogs: any[] = [];

async function logAudit(
  developerId: string,
  action: string,
  details: Record<string, any>
) {
  auditLogs.push({
    id: crypto.randomUUID(),
    developerId,
    action,
    details,
    timestamp: new Date(),
  });
}

export const developerToolsRouter = router({
  // Code Sandbox - Execute code safely
  runSandbox: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        language: z.enum(["javascript", "typescript", "python"]),
        timeout: z.number().default(5000), // 5 seconds
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.user?.id || "default";
      const startTime = Date.now();

      try {
        let result: any;

        if (input.language === "javascript" || input.language === "typescript") {
          // For TypeScript, we would normally compile first
          // For now, we'll just evaluate JavaScript

          // Create a safe sandbox context
          const sandbox = {
            console: {
              log: (...args: any[]) => logs.push(args.map(String).join(" ")),
              error: (...args: any[]) => logs.push(`ERROR: ${args.map(String).join(" ")}`),
              warn: (...args: any[]) => logs.push(`WARN: ${args.map(String).join(" ")}`),
            },
            Math,
            Date,
            JSON,
            Array,
            Object,
            String,
            Number,
            Boolean,
            setTimeout: undefined,
            setInterval: undefined,
            fetch: undefined,
            require: undefined,
          };

          const logs: string[] = [];

          // Use Function constructor for safer evaluation
          const wrappedCode = `
            (function() {
              ${input.code}
            })()
          `;

          try {
            // Note: In production, use vm2 or isolated-vm for proper sandboxing
            const fn = new Function(...Object.keys(sandbox), wrappedCode);
            result = fn(...Object.values(sandbox));
          } catch (evalError: any) {
            result = { error: evalError.message };
          }

          const executionTime = Date.now() - startTime;

          await logAudit(developerId, "sandbox_executed", {
            language: input.language,
            executionTime,
            success: !result?.error,
          });

          return {
            result: result?.error ? null : result,
            logs,
            error: result?.error || null,
            executionTime,
          };
        } else {
          // Python execution would require a separate service
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Python execution not yet supported in this environment",
          });
        }
      } catch (error: any) {
        await logAudit(developerId, "sandbox_error", {
          language: input.language,
          error: error.message,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // API Test Tool - Test endpoints
  testApiEndpoint: protectedProcedure
    .input(
      z.object({
        method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
        url: z.string().url(),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.any().optional(),
        timeout: z.number().default(30000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.user?.id || "default";
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), input.timeout);

        const response = await fetch(input.url, {
          method: input.method,
          headers: {
            "Content-Type": "application/json",
            ...input.headers,
          },
          body: input.body ? JSON.stringify(input.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;
        const responseBody = await response.text();

        let parsedBody;
        try {
          parsedBody = JSON.parse(responseBody);
        } catch {
          parsedBody = responseBody;
        }

        await logAudit(developerId, "api_test_executed", {
          method: input.method,
          url: input.url,
          statusCode: response.status,
          responseTime,
        });

        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedBody,
          responseTime,
        };
      } catch (error: any) {
        await logAudit(developerId, "api_test_error", {
          method: input.method,
          url: input.url,
          error: error.message,
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
    }),

  // Code Quality Analysis
  analyzeCode: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        language: z.enum(["javascript", "typescript"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const developerId = ctx.user?.id || "default";

      // Basic code analysis
      const issues: any[] = [];
      const lines = input.code.split("\n");

      // Check for common issues
      lines.forEach((line, index) => {
        // Check for console.log in production code
        if (line.includes("console.log")) {
          issues.push({
            line: index + 1,
            severity: "warning",
            message: "Consider removing console.log for production",
            rule: "no-console",
          });
        }

        // Check for var usage
        if (/\bvar\s+/.test(line)) {
          issues.push({
            line: index + 1,
            severity: "warning",
            message: "Use 'let' or 'const' instead of 'var'",
            rule: "no-var",
          });
        }

        // Check for == instead of ===
        if (/[^=!]==[^=]/.test(line)) {
          issues.push({
            line: index + 1,
            severity: "warning",
            message: "Use '===' instead of '=='",
            rule: "eqeqeq",
          });
        }

        // Check for potential security issues
        if (line.includes("eval(")) {
          issues.push({
            line: index + 1,
            severity: "error",
            message: "Avoid using eval() - security risk",
            rule: "no-eval",
          });
        }

        // Check for long lines
        if (line.length > 120) {
          issues.push({
            line: index + 1,
            severity: "info",
            message: `Line too long (${line.length} characters)`,
            rule: "max-len",
          });
        }
      });

      // Calculate metrics
      const metrics = {
        totalLines: lines.length,
        codeLines: lines.filter(l => l.trim() && !l.trim().startsWith("//")).length,
        commentLines: lines.filter(l => l.trim().startsWith("//")).length,
        emptyLines: lines.filter(l => !l.trim()).length,
        functionCount: (input.code.match(/function\s+\w+/g) || []).length +
                       (input.code.match(/\w+\s*=\s*\(/g) || []).length,
        importCount: (input.code.match(/import\s+/g) || []).length,
      };

      await logAudit(developerId, "code_analyzed", {
        language: input.language,
        issueCount: issues.length,
      });

      return {
        issues,
        metrics,
        score: Math.max(0, 100 - issues.filter(i => i.severity === "error").length * 10 -
                                    issues.filter(i => i.severity === "warning").length * 5),
      };
    }),

  // Log Viewer
  getLogs: protectedProcedure
    .input(
      z.object({
        environment: z.enum(["production", "staging", "development", "sandbox"]).default("development"),
        level: z.enum(["debug", "info", "warn", "error"]).optional(),
        search: z.string().optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      // In a real implementation, this would fetch from a logging service
      // For now, return mock logs
      const mockLogs = [
        { timestamp: new Date(), level: "info", message: "Server started", service: "api" },
        { timestamp: new Date(), level: "debug", message: "Database connected", service: "db" },
        { timestamp: new Date(), level: "warn", message: "High memory usage", service: "monitor" },
      ];

      let filtered = mockLogs;

      if (input.level) {
        filtered = filtered.filter(l => l.level === input.level);
      }

      if (input.search) {
        filtered = filtered.filter(l =>
          l.message.toLowerCase().includes(input.search!.toLowerCase())
        );
      }

      return {
        logs: filtered.slice(0, input.limit),
        total: filtered.length,
        environment: input.environment,
      };
    }),

  // Performance Profiler
  getPerformanceProfile: protectedProcedure
    .input(
      z.object({
        endpoint: z.string(),
        period: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
      })
    )
    .query(async ({ ctx, input }) => {
      // Mock performance data
      const now = Date.now();
      const hourMs = 60 * 60 * 1000;

      const dataPoints = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(now - (23 - i) * hourMs),
        responseTime: Math.random() * 100 + 50,
        requestCount: Math.floor(Math.random() * 1000),
        errorRate: Math.random() * 0.05,
        p50: Math.random() * 50 + 30,
        p95: Math.random() * 100 + 80,
        p99: Math.random() * 150 + 100,
      }));

      return {
        endpoint: input.endpoint,
        period: input.period,
        dataPoints,
        summary: {
          avgResponseTime: dataPoints.reduce((a, b) => a + b.responseTime, 0) / dataPoints.length,
          totalRequests: dataPoints.reduce((a, b) => a + b.requestCount, 0),
          avgErrorRate: dataPoints.reduce((a, b) => a + b.errorRate, 0) / dataPoints.length,
        },
      };
    }),

  // Generate Documentation
  generateDocs: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        language: z.enum(["javascript", "typescript"]),
        format: z.enum(["jsdoc", "markdown", "openapi"]).default("jsdoc"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.user?.id || "default";

      // Basic documentation generation
      const functions = input.code.match(/(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g) || [];
      const arrowFunctions = input.code.match(/(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g) || [];

      const docs: string[] = [];

      if (input.format === "jsdoc") {
        functions.forEach(fn => {
          const name = fn.match(/function\s+(\w+)/)?.[1] || "unknown";
          docs.push(`/**
 * @function ${name}
 * @description TODO: Add description
 * @returns {any} TODO: Add return type
 */`);
        });
      } else if (input.format === "markdown") {
        docs.push("# API Documentation\n");
        docs.push("## Functions\n");
        functions.forEach(fn => {
          const name = fn.match(/function\s+(\w+)/)?.[1] || "unknown";
          docs.push(`### \`${name}\`\n`);
          docs.push("TODO: Add description\n");
        });
      }

      await logAudit(developerId, "docs_generated", {
        language: input.language,
        format: input.format,
        functionCount: functions.length + arrowFunctions.length,
      });

      return {
        documentation: docs.join("\n"),
        functionsFound: functions.length + arrowFunctions.length,
        format: input.format,
      };
    }),

  // Get tool audit logs
  getToolAuditLogs: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const developerId = ctx.user?.id || "default";
      return auditLogs
        .filter(l => l.developerId === developerId)
        .slice(-input.limit)
        .reverse();
    }),
});
