# 🤖 HADEROS AI Assistant

## 🚀 Overview

HADEROS AI Assistant is a powerful, integrated system that uses multiple AI providers (DeepSeek, OpenAI, Gemini, Anthropic, Grok) with a **cost-optimization engine** to automate critical software development tasks:

- **Code Analysis:** Automatically review code for quality, bugs, and best practices.
- **Test Generation:** Generate comprehensive unit and integration tests.
- **Security Audits:** Perform automated security checks for vulnerabilities.
- **Performance Analysis:** Identify performance bottlenecks and suggest optimizations.

---

## ✨ Features

- **Multi-Provider Support:** Seamlessly switch between DeepSeek, OpenAI, Gemini, Anthropic, and Grok.
- **Cost Optimization:** Intelligently selects the most cost-effective provider for each task, starting with free providers like DeepSeek.
- **Task Orchestration:** Run multiple AI tasks in parallel for maximum efficiency.
- **CLI Interface:** Easy-to-use command-line interface for all major functions.
- **Structured Reports:** Generate detailed, actionable reports in Markdown format.
- **Extensible Modules:** Easily add new AI-powered capabilities.

---

## 🛠️ Architecture

### **Core Components:**

- **`AIClient`:** Manages connections and requests to multiple AI providers.
- **`CostOptimizedOrchestrator`:** Intelligently selects providers to minimize costs while maintaining quality.
- **`AIOrchestrator`:** Basic task distribution (now used internally by the cost optimizer).

### **Modules:**

- **`CodeAnalyzer`:** Analyzes code quality and generates reports.
- **`TestGenerator`:** Generates test files using Vitest framework.
- **`SecurityAuditor`:** Performs security audits and identifies vulnerabilities.

### **Interface:**

- **`CLI`:** Command-line interface for developers.
- **`API` (Future):** REST API for programmatic access.

---

## 🚀 Getting Started

### **1. Installation**

```bash
# Navigate to the AI Assistant directory
cd server/ai-assistant

# Install dependencies
npm install
```

### **2. Configuration**

Set up your AI provider API keys in the `.env` file at the root of the project:

```env
# Add DeepSeek for free, high-performance tasks!
DEEPSEEK_API_KEY="your-deepseek-api-key" # Get a free key from platform.deepseek.com

# Other providers (optional)
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
GEMINI_API_KEY="your-gemini-api-key"
XAI_API_KEY="your-grok-api-key"
```

**Recommendation:** Start with just the `DEEPSEEK_API_KEY` to leverage the free tier!

### **3. Usage (CLI)**

The CLI provides several commands to automate your workflow.

#### **Analyze Code**

Analyze a single file or an entire directory for code quality.

```bash
# Analyze a single file
npm run analyze -- path/to/your/file.ts

# Analyze an entire directory
npm run analyze -- server/src

# Save report to a file
npm run analyze -- server/src -o code-analysis-report.md
```

#### **Generate Tests**

Automatically generate Vitest tests for your code.

```bash
# Generate tests for a single file
npm run generate-tests -- path/to/your/file.ts

# Generate tests for an entire directory
npm run generate-tests -- server/src
```

Generated tests will be placed in a `__tests__` subdirectory next to the source file.

#### **Perform Security Audit**

Run a security audit to find vulnerabilities.

```bash
# Audit a single file
npm run audit -- path/to/your/file.ts

# Audit an entire directory
npm run audit -- server/src

# Save report to a file
npm run audit -- server/src -o security-report.md
```

#### **Full Scan (All-in-One)**

Run code analysis, test generation, and security audit in one command.

```bash
# Scan an entire directory
npm run scan -- server/src

# Specify output directory for reports
npm run scan -- server/src -o ./ai-scan-reports
```

This will generate a set of comprehensive reports in the specified output directory.

---

## ⚙️ How It Works

1. **Task Creation:** The CLI creates a task (e.g., `code-review`, `test-generation`).
2. **Orchestration:** The `CostOptimizedOrchestrator` intelligently selects the most cost-effective provider. It will try free providers like DeepSeek first before falling back to paid models.
3. **AI Execution:** The `AIClient` sends the request to the chosen AI provider.
4. **Response Parsing:** The relevant module (e.g., `CodeAnalyzer`) parses the AI response into a structured format.
5. **Report Generation:** A detailed Markdown report is generated from the structured data.

---

## 🔮 Future Roadmap

- **Performance Analysis Module:** Automatically identify and suggest fixes for performance bottlenecks.
- **Auto-Fix Capabilities:** Automatically apply suggested fixes for code quality and security issues.
- **REST API:** Provide an API for programmatic access to the AI Assistant.
- **Dashboard UI:** A web-based dashboard to view reports and manage tasks.
- **CI/CD Integration:** Integrate the AI Assistant directly into the CI/CD pipeline to automate checks on every commit.

---

## 🤝 Contribution

Contributions are welcome! Please feel free to submit pull requests or open issues.

---

**HADEROS AI Assistant** - Building better software, faster. 🚀
