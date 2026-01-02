/**
 * Bio-Module API Routes
 *
 * Simple API endpoints for monitoring bio-module integration
 */

import { Router, Request, Response } from 'express';
import { getEnhancedOrchestrator } from './enhanced-orchestrator';
import { getBioDashboard } from './bio-dashboard';
import { getBioMessageRouter } from './unified-messaging';
import { getConflictEngine } from './conflict-resolution-protocol';
import { runCriticalScenarios } from './critical-scenarios';

const router = Router();

/**
 * GET /api/bio/stats
 * Get overall bio-system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const orchestrator = getEnhancedOrchestrator();
    const stats = orchestrator.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/bio/health
 * Get system health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const orchestrator = getEnhancedOrchestrator();
    const health = orchestrator.getSystemHealth();

    res.json({
      success: true,
      data: health,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/bio/dashboard
 * Get complete dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const dashboard = getBioDashboard();
    const data = dashboard.getDashboardData();

    res.json({
      success: true,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/bio/interactions
 * Get recent interactions
 */
router.get('/interactions', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const dashboard = getBioDashboard();
    const interactions = dashboard.getRecentInteractions(limit);

    res.json({
      success: true,
      data: interactions,
      count: interactions.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/bio/conflicts
 * Get recent conflicts
 */
router.get('/conflicts', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const conflictEngine = getConflictEngine();
    const conflicts = conflictEngine.getResolutionHistory(limit);

    res.json({
      success: true,
      data: conflicts,
      count: conflicts.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/bio/messages
 * Get recent messages
 */
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const router = getBioMessageRouter();
    const messages = router.getRecentMessages(limit);

    res.json({
      success: true,
      data: messages,
      count: messages.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/bio/test/scenarios
 * Run critical test scenarios
 */
router.post('/test/scenarios', async (req: Request, res: Response) => {
  try {
    const results = await runCriticalScenarios();

    res.json({
      success: true,
      data: results,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/bio/test/scenarios
 * Get list of available test scenarios
 */
router.get('/test/scenarios', async (req: Request, res: Response) => {
  try {
    const { CRITICAL_SCENARIOS } = await import('./critical-scenarios');

    const scenarios = CRITICAL_SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      expected: s.expected,
      criticalityLevel: s.criticalityLevel,
    }));

    res.json({
      success: true,
      data: scenarios,
      count: scenarios.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * GET /api/bio/modules
 * Get list of all bio-modules and their status
 */
router.get('/modules', async (req: Request, res: Response) => {
  try {
    const dashboard = getBioDashboard();
    const data = dashboard.getDashboardData();

    const modules = data.moduleHealth.map((m) => ({
      name: m.name,
      status: m.status,
      lastActive: m.lastActive,
      avgResponseTime: m.avgResponseTime,
      errorRate: m.errorRate,
      uptime: m.uptime,
    }));

    res.json({
      success: true,
      data: modules,
      count: modules.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

/**
 * POST /api/bio/reset
 * Reset dashboard data (for testing)
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const dashboard = getBioDashboard();
    dashboard.reset();

    res.json({
      success: true,
      message: 'Dashboard reset successfully',
      timestamp: Date.now(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

export default router;
