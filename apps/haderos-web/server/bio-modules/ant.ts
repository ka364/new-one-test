/**
 * Ant Colony Module - Swarm Intelligence for Route Optimization
 * 
 * Inspired by: Ant colony optimization algorithms
 * Problem: Inefficient delivery routes
 * Solution: Swarm intelligence for logistics optimization
 */

import { getEventBus } from "../events/eventBus";
import { createAgentInsight } from "../db";

export interface DeliveryPoint {
  id: number;
  orderId: number;
  address: string;
  latitude: number;
  longitude: number;
  priority: number; // 1-10
  timeWindow?: {
    start: Date;
    end: Date;
  };
  estimatedDuration: number; // minutes
}

export interface Route {
  id: string;
  points: DeliveryPoint[];
  totalDistance: number; // km
  totalDuration: number; // minutes
  totalCost: number; // EGP
  efficiency: number; // 0-100
  pheromoneLevel: number; // For ACO algorithm
}

export interface OptimizationResult {
  bestRoute: Route;
  alternativeRoutes: Route[];
  improvement: number; // Percentage improvement over naive route
  computationTime: number; // ms
  iterations: number;
}

/**
 * Ant Colony Optimizer
 * 
 * Uses Ant Colony Optimization (ACO) algorithm to find optimal delivery routes
 */
export class AntColonyOptimizer {
  private readonly ALPHA = 1.0; // Pheromone importance
  private readonly BETA = 2.0; // Distance importance
  private readonly EVAPORATION_RATE = 0.5;
  private readonly PHEROMONE_DEPOSIT = 100;
  private readonly NUM_ANTS = 20;
  private readonly MAX_ITERATIONS = 100;
  private readonly COST_PER_KM = 3; // EGP
  private readonly COST_PER_MINUTE = 1; // EGP

  /**
   * Optimize delivery routes using ACO
   */
  async optimizeRoutes(deliveries: DeliveryPoint[], startPoint?: { lat: number; lng: number }): Promise<OptimizationResult> {
    const startTime = Date.now();

    if (deliveries.length === 0) {
      throw new Error("No deliveries to optimize");
    }

    if (deliveries.length === 1) {
      // Single delivery - no optimization needed
      const route = this.createRoute([deliveries[0]]);
      return {
        bestRoute: route,
        alternativeRoutes: [],
        improvement: 0,
        computationTime: Date.now() - startTime,
        iterations: 0
      };
    }

    // Initialize pheromone matrix
    const pheromones = this.initializePheromones(deliveries.length);

    // Calculate distance matrix
    const distances = this.calculateDistanceMatrix(deliveries);

    // Run ACO algorithm
    let bestRoute: Route | null = null;
    const alternativeRoutes: Route[] = [];
    let iteration = 0;

    for (iteration = 0; iteration < this.MAX_ITERATIONS; iteration++) {
      const routes: Route[] = [];

      // Each ant constructs a route
      for (let ant = 0; ant < this.NUM_ANTS; ant++) {
        const route = this.constructRoute(deliveries, pheromones, distances);
        routes.push(route);

        // Update best route
        if (!bestRoute || route.totalCost < bestRoute.totalCost) {
          bestRoute = route;
        }
      }

      // Update pheromones
      this.updatePheromones(pheromones, routes);

      // Store top 3 alternative routes
      if (iteration % 20 === 0) {
        const sortedRoutes = routes.sort((a, b) => a.totalCost - b.totalCost);
        alternativeRoutes.push(...sortedRoutes.slice(1, 4));
      }

      // Early stopping if solution is good enough
      if (bestRoute && bestRoute.efficiency > 95) {
        break;
      }
    }

    // Calculate improvement over naive route
    const naiveRoute = this.createNaiveRoute(deliveries);
    const improvement = ((naiveRoute.totalCost - bestRoute!.totalCost) / naiveRoute.totalCost) * 100;

    const computationTime = Date.now() - startTime;

    // Log optimization result
    console.log(`[Ant] Optimized route for ${deliveries.length} deliveries in ${computationTime}ms (${iteration} iterations)`);
    console.log(`[Ant] Improvement: ${improvement.toFixed(1)}% (${naiveRoute.totalCost.toFixed(0)} → ${bestRoute!.totalCost.toFixed(0)} EGP)`);

    // Create insight
    await createAgentInsight({
      agentType: "ant",
      insightType: "route_optimized",
      title: `🐜 Route Optimized - ${improvement.toFixed(0)}% Improvement`,
      titleAr: `🐜 تم تحسين المسار - تحسين ${improvement.toFixed(0)}٪`,
      description: `Optimized delivery route for ${deliveries.length} stops. Saved ${(naiveRoute.totalCost - bestRoute!.totalCost).toFixed(0)} EGP.`,
      descriptionAr: `تم تحسين مسار التوصيل لـ ${deliveries.length} نقطة. تم توفير ${(naiveRoute.totalCost - bestRoute!.totalCost).toFixed(0)} جنيه.`,
      // severity: "low",
      actionable: false,
      metadata: {
        deliveries: deliveries.length,
        improvement: improvement,
        savedCost: naiveRoute.totalCost - bestRoute!.totalCost,
        computationTime
      }
    });

    return {
      bestRoute: bestRoute!,
      alternativeRoutes: alternativeRoutes.slice(0, 3),
      improvement,
      computationTime,
      iterations: iteration
    };
  }

  /**
   * Initialize pheromone matrix
   */
  private initializePheromones(size: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        matrix[i][j] = 1.0; // Initial pheromone level
      }
    }
    return matrix;
  }

  /**
   * Calculate distance matrix between all points
   */
  private calculateDistanceMatrix(points: DeliveryPoint[]): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < points.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < points.length; j++) {
        if (i === j) {
          matrix[i][j] = 0;
        } else {
          matrix[i][j] = this.calculateDistance(points[i], points[j]);
        }
      }
    }
    return matrix;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(p1: DeliveryPoint, p2: DeliveryPoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(p2.latitude - p1.latitude);
    const dLon = this.toRad(p2.longitude - p1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(p1.latitude)) * Math.cos(this.toRad(p2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Construct route using ACO algorithm
   */
  private constructRoute(points: DeliveryPoint[], pheromones: number[][], distances: number[][]): Route {
    const visited = new Set<number>();
    const route: DeliveryPoint[] = [];
    let currentIndex = 0; // Start from first point

    route.push(points[currentIndex]);
    visited.add(currentIndex);

    // Visit all remaining points
    while (visited.size < points.length) {
      const nextIndex = this.selectNextPoint(currentIndex, points, visited, pheromones, distances);
      route.push(points[nextIndex]);
      visited.add(nextIndex);
      currentIndex = nextIndex;
    }

    return this.createRoute(route);
  }

  /**
   * Select next point using ACO probability
   */
  private selectNextPoint(
    currentIndex: number,
    points: DeliveryPoint[],
    visited: Set<number>,
    pheromones: number[][],
    distances: number[][]
  ): number {
    const probabilities: number[] = [];
    let sum = 0;

    // Calculate probabilities for unvisited points
    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) {
        probabilities[i] = 0;
      } else {
        const pheromone = Math.pow(pheromones[currentIndex][i], this.ALPHA);
        const distance = Math.pow(1 / (distances[currentIndex][i] + 0.1), this.BETA);
        const priority = points[i].priority / 10; // Normalize to 0-1
        probabilities[i] = pheromone * distance * (1 + priority);
        sum += probabilities[i];
      }
    }

    // Normalize probabilities
    for (let i = 0; i < probabilities.length; i++) {
      probabilities[i] /= sum;
    }

    // Select next point using roulette wheel selection
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (random <= cumulative) {
        return i;
      }
    }

    // Fallback: return first unvisited point
    for (let i = 0; i < points.length; i++) {
      if (!visited.has(i)) return i;
    }

    return 0;
  }

  /**
   * Update pheromones based on routes
   */
  private updatePheromones(pheromones: number[][], routes: Route[]): void {
    // Evaporation
    for (let i = 0; i < pheromones.length; i++) {
      for (let j = 0; j < pheromones[i].length; j++) {
        pheromones[i][j] *= (1 - this.EVAPORATION_RATE);
      }
    }

    // Deposit pheromones
    for (const route of routes) {
      const deposit = this.PHEROMONE_DEPOSIT / route.totalCost;
      for (let i = 0; i < route.points.length - 1; i++) {
        const from = route.points[i].id;
        const to = route.points[i + 1].id;
        pheromones[from][to] += deposit;
        pheromones[to][from] += deposit; // Symmetric
      }
    }
  }

  /**
   * Create route object from points
   */
  private createRoute(points: DeliveryPoint[]): Route {
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += this.calculateDistance(points[i], points[i + 1]);
      totalDuration += points[i].estimatedDuration;
    }
    totalDuration += points[points.length - 1].estimatedDuration;

    const totalCost = (totalDistance * this.COST_PER_KM) + (totalDuration * this.COST_PER_MINUTE);
    const efficiency = Math.min(100, (1 / (totalCost / 100)) * 100);

    return {
      id: `route_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      points,
      totalDistance,
      totalDuration,
      totalCost,
      efficiency,
      pheromoneLevel: 1.0
    };
  }

  /**
   * Create naive route (no optimization)
   */
  private createNaiveRoute(points: DeliveryPoint[]): Route {
    return this.createRoute([...points]);
  }

  /**
   * Optimize multi-day routes
   */
  async optimizeMultiDayRoutes(
    deliveries: DeliveryPoint[],
    maxDeliveriesPerDay: number
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];

    // Split deliveries into days
    for (let i = 0; i < deliveries.length; i += maxDeliveriesPerDay) {
      const dayDeliveries = deliveries.slice(i, i + maxDeliveriesPerDay);
      const result = await this.optimizeRoutes(dayDeliveries);
      results.push(result);
    }

    return results;
  }
}

// Export singleton instance
export const antOptimizer = new AntColonyOptimizer();
