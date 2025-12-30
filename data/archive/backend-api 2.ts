/**
 * Backend API Client for haderos-platform integration
 * 
 * This module provides a unified interface to communicate with the
 * Python/FastAPI backend (haderos-platform).
 */

// Get base URL from environment, fallback to localhost
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

// Optional API key for public/limited authentication
// NOTE: This is NOT secure for sensitive secrets - use JWT or server-side proxy instead
const API_KEY = import.meta.env.VITE_BACKEND_API_KEY;

/**
 * Generic API fetch wrapper with error handling
 */
export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  // Set content type
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Add API key if available
  if (API_KEY) {
    headers.set("X-API-Key", API_KEY);
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }

    return await res.text() as T;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`Backend not reachable at ${API_BASE}. Is haderos-platform running?`);
    }
    throw error;
  }
}

/**
 * Health Check - Test backend connectivity
 */
export async function getHealth(): Promise<{ status: string; message?: string }> {
  return apiFetch("/health");
}

/**
 * KAIA Engine - Check Sharia compliance
 */
export interface ShariaCheckRequest {
  transaction_type: string;
  amount: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ShariaCheckResponse {
  compliant: boolean;
  confidence: number;
  violations: string[];
  recommendations: string[];
  reasoning: string;
}

export async function checkShariaCompliance(data: ShariaCheckRequest): Promise<ShariaCheckResponse> {
  return apiFetch("/api/v1/sharia/check", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * KAIA Compliance Check - Simplified interface for investor demo
 */
export interface KAIAComplianceRequest {
  transaction_type: string;
  amount: number;
  description?: string;
  interest_rate?: number;
  contract_terms?: string;
}

export interface KAIAComplianceResponse {
  compliant: boolean;
  score: number;
  violations: string[];
  recommendations: string[];
  details: {
    riba: boolean;
    gharar: boolean;
    maysir: boolean;
  };
}

export async function checkKAIACompliance(data: KAIAComplianceRequest): Promise<KAIAComplianceResponse> {
  // For MVP demo, we'll use mock data since backend may not be running
  // In production, this would call: return apiFetch("/api/v1/kaia/verify", { method: "POST", body: JSON.stringify(data) });
  
  // Mock implementation for demo
  const hasInterest = (data.interest_rate ?? 0) > 0;
  const hasUnclearTerms = !data.contract_terms || data.contract_terms.trim().length < 10;
  const isHighRisk = data.amount > 100000;
  
  const violations: string[] = [];
  const recommendations: string[] = [];
  
  if (hasInterest) {
    violations.push("تم اكتشاف ربا: المعاملة تتضمن فائدة ربوية");
    recommendations.push("استبدل الفائدة بنظام مشاركة في الأرباح أو مرابحة");
  }
  
  if (hasUnclearTerms) {
    violations.push("تم اكتشاف غرر: شروط العقد غير واضحة");
    recommendations.push("أضف شروط عقد واضحة ومحددة");
  }
  
  if (isHighRisk && data.transaction_type === "investment") {
    violations.push("تم اكتشاف ميسر: استثمار عالي المخاطرة بدون ضمانات");
    recommendations.push("أضف ضمانات واضحة وقلل من عنصر المضاربة");
  }
  
  const compliant = violations.length === 0;
  const score = compliant ? 100 : Math.max(0, 100 - (violations.length * 30));
  
  if (compliant) {
    recommendations.push("المعاملة متوافقة مع الشريعة الإسلامية");
    recommendations.push("تأكد من توثيق جميع الشروط كتابياً");
  }
  
  return {
    compliant,
    score,
    violations,
    recommendations,
    details: {
      riba: hasInterest,
      gharar: hasUnclearTerms,
      maysir: isHighRisk && data.transaction_type === "investment"
    }
  };
}

/**
 * Audit Trail - Get compliance audit logs
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  transaction_id: string;
  decision: string;
  confidence: number;
  violations: string[];
  metadata?: Record<string, any>;
}

export async function getAuditTrail(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<AuditLogEntry[]> {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.set("start_date", params.start_date);
  if (params?.end_date) queryParams.set("end_date", params.end_date);
  if (params?.limit) queryParams.set("limit", params.limit.toString());

  const query = queryParams.toString();
  return apiFetch(`/api/v1/audit/trail${query ? `?${query}` : ""}`);
}

/**
 * Risk Assessment - Get AI-powered risk analysis
 */
export interface RiskAssessmentRequest {
  transaction_amount: number;
  transaction_type: string;
  customer_history?: number;
  market_conditions?: Record<string, any>;
}

export interface RiskAssessmentResponse {
  risk_score: number;
  risk_level: "low" | "medium" | "high" | "critical";
  factors: Array<{
    name: string;
    weight: number;
    value: number;
  }>;
  recommendations: string[];
}

export async function assessRisk(data: RiskAssessmentRequest): Promise<RiskAssessmentResponse> {
  return apiFetch("/api/v1/ai/risk-assessment", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Backend connection status hook
 */
export async function checkBackendConnection(): Promise<boolean> {
  try {
    await getHealth();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get backend base URL (for display purposes)
 */
export function getBackendUrl(): string {
  return API_BASE;
}
