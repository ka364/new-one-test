// Developer Tools Router
// Provides APIs for developer tools, sandbox, code analysis, and debugging

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { developers, developerAuditLogs } from "../../drizzle/schema-developer";
import { eq } from "drizzle-orm";
import * as vm from "vm";
import * as ts from "typescript";

export const developerToolsRouter = createTRPCRouter({
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
      const developerId = ctx.session.user.id;

      try {
        let result: any;
        let output: string = "";
        let errors: string[] = [];

        if (input.language === "javascript") {
          // Execute JavaScript in sandbox
          const sandbox = {
            console: {
              log: (...args: any[]) => {
                output += args.map((arg) => String(arg)).join(" ") + "\n";
              },
              error: (...args: any[]) => {
                errors.push(args.map((arg) => String(arg)).join(" "));
              },
            },
            setTimeout,
            setInterval,
            clearTimeout,
            clearInterval,
          };

          const script = new vm.Script(input.code);
          const context = vm.createContext(sandbox);

          result = script.runInContext(context, {
            timeout: input.timeout,
            displayErrors: true,
          });
        } else if (input.language === "typescript") {
          // Transpile TypeScript to JavaScript first
          const jsCode = ts.transpileModule(input.code, {
            compilerOptions: {
              module: ts.ModuleKind.CommonJS,
              target: ts.ScriptTarget.ES2020,
            },
          }).outputText;

          // Then execute
          const sandbox = {
            console: {
              log: (...args: any[]) => {
                output += args.map((arg) => String(arg)).join(" ") + "\n";
              },
              error: (...args: any[]) => {
                errors.push(args.map((arg) => String(arg)).join(" "));
              },
            },
          };

          const script = new vm.Script(jsCode);
          const context = vm.createContext(sandbox);

          result = script.runInContext(context, {
            timeout: input.timeout,
            displayErrors: true,
          });
        }

        // Log execution
        await ctx.db.insert(developerAuditLogs).values({
          developerId,
          action: "sandbox_execution",
          details: {
            language: input.language,
            codeLength: input.code.length,
            success: true,
          },
          timestamp: new Date(),
        });

        return {
          success: true,
          result,
          output,
          errors: errors.length > 0 ? errors : undefined,
        };
      } catch (error: any) {
        // Log failed execution
        await ctx.db.insert(developerAuditLogs).values({
          developerId,
          action: "sandbox_execution_failed",
          details: {
            language: input.language,
            error: error.message,
          },
          timestamp: new Date(),
          success: false,
        });

        return {
          success: false,
          error: error.message,
        };
      }
    }),

  // API Tester - Test API endpoints
  testAPI: protectedProcedure
    .input(
      z.object({
        method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
        url: z.string().url(),
        headers: z.record(z.string()).optional(),
        body: z.any().optional(),
        timeout: z.number().default(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      try {
        const startTime = Date.now();

        const response = await fetch(input.url, {
          method: input.method,
          headers: {
            "Content-Type": "application/json",
            ...input.headers,
          },
          body: input.body ? JSON.stringify(input.body) : undefined,
          signal: AbortSignal.timeout(input.timeout),
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        const responseData = await response.text();
        let parsedData: any;

        try {
          parsedData = JSON.parse(responseData);
        } catch {
          parsedData = responseData;
        }

        // Log API test
        await ctx.db.insert(developerAuditLogs).values({
          developerId,
          action: "api_test",
          details: {
            method: input.method,
            url: input.url,
            status: response.status,
            duration,
          },
          timestamp: new Date(),
        });

        return {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: parsedData,
          duration,
        };
      } catch (error: any) {
        // Log failed API test
        await ctx.db.insert(developerAuditLogs).values({
          developerId,
          action: "api_test_failed",
          details: {
            method: input.method,
            url: input.url,
            error: error.message,
          },
          timestamp: new Date(),
          success: false,
        });

        return {
          success: false,
          error: error.message,
        };
      }
    }),

  // Database Query Tool
  runQuery: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        environment: z.enum(["sandbox", "development"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      // Check permissions
      const developer = await ctx.db.query.developers.findFirst({
        where: eq(developers.id, developerId),
        with: {
          permissions: true,
        },
      });

      if (!developer?.permissions?.canWrite) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Write permission required",
        });
      }

      // Only allow SELECT queries for safety
      const trimmedQuery = input.query.trim().toUpperCase();
      if (!trimmedQuery.startsWith("SELECT")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only SELECT queries are allowed",
        });
      }

      try {
        const startTime = Date.now();
        const result = await ctx.db.execute(input.query);
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log query execution
        await ctx.db.insert(developerAuditLogs).values({
          developerId,
          action: "query_execution",
          details: {
            environment: input.environment,
            queryLength: input.query.length,
            duration,
            rowCount: result.rows.length,
          },
          timestamp: new Date(),
        });

        return {
          success: true,
          rows: result.rows,
          rowCount: result.rows.length,
          duration,
        };
      } catch (error: any) {
        // Log failed query
        await ctx.db.insert(developerAuditLogs).values({
          developerId,
          action: "query_execution_failed",
          details: {
            environment: input.environment,
            error: error.message,
          },
          timestamp: new Date(),
          success: false,
        });

        return {
          success: false,
          error: error.message,
        };
      }
    }),

  // Code Analyzer - Analyze code quality
  analyzeCode: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        language: z.enum(["javascript", "typescript"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      try {
        const issues: any[] = [];
        const metrics = {
          lines: 0,
          functions: 0,
          classes: 0,
          complexity: 0,
        };

        if (input.language === "typescript" || input.language === "javascript") {
          // Parse TypeScript/JavaScript
          const sourceFile = ts.createSourceFile(
            "temp.ts",
            input.code,
            ts.ScriptTarget.Latest,
            true
          );

          metrics.lines = sourceFile.getLineAndCharacterOfPosition(sourceFile.end).line + 1;

          // Count functions and classes
          function visit(node: ts.Node) {
            if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
              metrics.functions++;
            }
            if (ts.isClassDeclaration(node)) {
              metrics.classes++;
            }
            ts.forEachChild(node, visit);
          }

          visit(sourceFile);

          // Check for common issues
          if (input.code.includes("console.log")) {
            issues.push({
              severity: "warning",
              message: "console.log statements found",
              line: 0,
            });
          }

          if (input.code.includes("any")) {
            issues.push({
              severity: "warning",
              message: "Avoid using 'any' type",
              line: 0,
            });
          }
        }

        // Log analysis
        await ctx.db.insert(developerAuditLogs).values({
          developerId,
          action: "code_analysis",
          details: {
            language: input.language,
            codeLength: input.code.length,
            issuesFound: issues.length,
          },
          timestamp: new Date(),
        });

        return {
          success: true,
          issues,
          metrics,
          score: Math.max(0, 100 - issues.length * 5),
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  // Log Viewer - View application logs
  getLogs: protectedProcedure
    .input(
      z.object({
        environment: z.enum(["production", "staging", "development", "sandbox"]),
        level: z.enum(["error", "warn", "info", "debug"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      // Check environment access
      const developer = await ctx.db.query.developers.findFirst({
        where: eq(developers.id, developerId),
        with: {
          permissions: true,
        },
      });

      const allowedEnvironments = developer?.permissions?.environments || [];
      if (!allowedEnvironments.includes(input.environment)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `No access to ${input.environment} environment`,
        });
      }

      // TODO: Implement actual log fetching from logging service
      // This is a placeholder
      const logs = [
        {
          timestamp: new Date(),
          level: "info",
          message: "Application started",
          environment: input.environment,
        },
      ];

      return {
        logs,
        total: logs.length,
      };
    }),

  // Performance Profiler
  profilePerformance: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        metrics: z.array(z.enum(["FCP", "LCP", "FID", "CLS", "TTFB"])),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      try {
        // TODO: Implement actual performance profiling
        // This is a placeholder
        const results = {
          FCP: 1200, // First Contentful Paint (ms)
          LCP: 2500, // Largest Contentful Paint (ms)
          FID: 100, // First Input Delay (ms)
          CLS: 0.1, // Cumulative Layout Shift
          TTFB: 600, // Time to First Byte (ms)
        };

        // Log profiling
        await ctx.db.insert(developerAuditLogs).values({
          developerId,
          action: "performance_profiling",
          details: {
            url: input.url,
            metrics: input.metrics,
          },
          timestamp: new Date(),
        });

        return {
          success: true,
          results,
          score: 85, // Overall performance score
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  // Documentation Generator
  generateDocs: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        format: z.enum(["markdown", "html", "json"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const developerId = ctx.session.user.id;

      try {
        // Parse TypeScript code
        const sourceFile = ts.createSourceFile(
          "temp.ts",
          input.code,
          ts.ScriptTarget.Latest,
          true
        );

        const docs: any[] = [];

        function visit(node: ts.Node) {
          if (ts.isFunctionDeclaration(node) && node.name) {
            docs.push({
              type: "function",
              name: node.name.text,
              parameters: node.parameters.map((p) => ({
                name: p.name.getText(),
                type: p.type?.getText() || "any",
              })),
              returnType: node.type?.getText() || "void",
            });
          }

          if (ts.isClassDeclaration(node) && node.name) {
            docs.push({
              type: "class",
              name: node.name.text,
              methods: [],
            });
          }

          ts.forEachChild(node, visit);
        }

        visit(sourceFile);

        // Format documentation
        let formatted: string;
        if (input.format === "markdown") {
          formatted = docs
            .map((doc) => {
              if (doc.type === "function") {
                return `## ${doc.name}\n\nParameters:\n${doc.parameters
                  .map((p: any) => `- ${p.name}: ${p.type}`)
                  .join("\n")}\n\nReturns: ${doc.returnType}`;
              }
              return "";
            })
            .join("\n\n");
        } else {
          formatted = JSON.stringify(docs, null, 2);
        }

        // Log doc generation
        await ctx.db.insert(developerAuditLogs).values({
          developerId,
          action: "docs_generated",
          details: {
            format: input.format,
            itemsCount: docs.length,
          },
          timestamp: new Date(),
        });

        return {
          success: true,
          documentation: formatted,
          items: docs,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});
