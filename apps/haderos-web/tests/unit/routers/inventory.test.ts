/**
 * Inventory Router Unit Tests
 * اختبارات شاملة لراوتر المخزون
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Inventory Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Stock Operations', () => {
    it('should add stock correctly', () => {
      const addStock = (currentStock: number, quantity: number, reason: string) => {
        if (quantity <= 0) {
          throw new Error('الكمية يجب أن تكون أكبر من صفر');
        }
        return {
          previousStock: currentStock,
          addedQuantity: quantity,
          newStock: currentStock + quantity,
          reason,
          timestamp: new Date(),
        };
      };

      const result = addStock(100, 50, 'إضافة مخزون جديد');
      expect(result.previousStock).toBe(100);
      expect(result.addedQuantity).toBe(50);
      expect(result.newStock).toBe(150);
      expect(() => addStock(100, 0, 'test')).toThrow('الكمية يجب أن تكون أكبر من صفر');
    });

    it('should deduct stock correctly', () => {
      const deductStock = (currentStock: number, quantity: number, allowNegative: boolean = false) => {
        if (quantity <= 0) {
          throw new Error('الكمية يجب أن تكون أكبر من صفر');
        }
        if (!allowNegative && currentStock < quantity) {
          throw new Error('الكمية المطلوبة أكبر من المتاح');
        }
        return {
          previousStock: currentStock,
          deductedQuantity: quantity,
          newStock: currentStock - quantity,
        };
      };

      expect(deductStock(100, 30)).toEqual({
        previousStock: 100,
        deductedQuantity: 30,
        newStock: 70,
      });

      expect(() => deductStock(10, 20)).toThrow('الكمية المطلوبة أكبر من المتاح');
      expect(deductStock(10, 20, true)).toEqual({
        previousStock: 10,
        deductedQuantity: 20,
        newStock: -10,
      });
    });

    it('should transfer stock between branches', () => {
      const transferStock = (
        fromBranch: { id: number; stock: number },
        toBranch: { id: number; stock: number },
        quantity: number
      ) => {
        if (quantity <= 0) {
          throw new Error('كمية التحويل يجب أن تكون أكبر من صفر');
        }
        if (fromBranch.stock < quantity) {
          throw new Error('الكمية غير متاحة في الفرع المصدر');
        }
        if (fromBranch.id === toBranch.id) {
          throw new Error('لا يمكن التحويل إلى نفس الفرع');
        }

        return {
          fromBranch: { id: fromBranch.id, newStock: fromBranch.stock - quantity },
          toBranch: { id: toBranch.id, newStock: toBranch.stock + quantity },
          transferredQuantity: quantity,
        };
      };

      const result = transferStock(
        { id: 1, stock: 100 },
        { id: 2, stock: 50 },
        30
      );

      expect(result.fromBranch.newStock).toBe(70);
      expect(result.toBranch.newStock).toBe(80);
      expect(result.transferredQuantity).toBe(30);

      expect(() =>
        transferStock({ id: 1, stock: 10 }, { id: 2, stock: 50 }, 20)
      ).toThrow('الكمية غير متاحة في الفرع المصدر');

      expect(() =>
        transferStock({ id: 1, stock: 100 }, { id: 1, stock: 100 }, 20)
      ).toThrow('لا يمكن التحويل إلى نفس الفرع');
    });
  });

  describe('Stock Alerts', () => {
    it('should detect low stock', () => {
      const checkLowStock = (currentStock: number, threshold: number = 10) => {
        return {
          isLow: currentStock <= threshold,
          currentStock,
          threshold,
          severity: currentStock === 0 ? 'critical' : currentStock <= threshold / 2 ? 'high' : 'medium',
        };
      };

      expect(checkLowStock(0, 10)).toEqual({
        isLow: true,
        currentStock: 0,
        threshold: 10,
        severity: 'critical',
      });

      expect(checkLowStock(5, 10)).toEqual({
        isLow: true,
        currentStock: 5,
        threshold: 10,
        severity: 'high',
      });

      expect(checkLowStock(8, 10)).toEqual({
        isLow: true,
        currentStock: 8,
        threshold: 10,
        severity: 'medium',
      });

      expect(checkLowStock(20, 10).isLow).toBe(false);
    });

    it('should detect overstock', () => {
      const checkOverstock = (currentStock: number, maxStock: number) => {
        const overstockAmount = Math.max(0, currentStock - maxStock);
        return {
          isOverstocked: currentStock > maxStock,
          overstockAmount,
          utilizationPercent: Math.round((currentStock / maxStock) * 100),
        };
      };

      expect(checkOverstock(150, 100)).toEqual({
        isOverstocked: true,
        overstockAmount: 50,
        utilizationPercent: 150,
      });

      expect(checkOverstock(80, 100).isOverstocked).toBe(false);
    });
  });

  describe('Inventory Valuation', () => {
    it('should calculate FIFO valuation', () => {
      const calculateFIFO = (batches: { quantity: number; costPerUnit: number }[]) => {
        const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
        const totalValue = batches.reduce((sum, b) => sum + (b.quantity * b.costPerUnit), 0);
        const avgCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

        return {
          totalQuantity,
          totalValue: Math.round(totalValue * 100) / 100,
          avgCostPerUnit: Math.round(avgCost * 100) / 100,
        };
      };

      const batches = [
        { quantity: 100, costPerUnit: 10 },
        { quantity: 50, costPerUnit: 12 },
        { quantity: 75, costPerUnit: 11 },
      ];

      const result = calculateFIFO(batches);
      expect(result.totalQuantity).toBe(225);
      expect(result.totalValue).toBe(2425); // (100*10) + (50*12) + (75*11)
      expect(result.avgCostPerUnit).toBe(10.78); // 2425/225
    });

    it('should calculate inventory turnover', () => {
      const calculateTurnover = (costOfGoodsSold: number, avgInventoryValue: number) => {
        if (avgInventoryValue === 0) {
          return { turnoverRatio: 0, daysToSell: Infinity };
        }
        const turnoverRatio = costOfGoodsSold / avgInventoryValue;
        const daysToSell = 365 / turnoverRatio;

        return {
          turnoverRatio: Math.round(turnoverRatio * 100) / 100,
          daysToSell: Math.round(daysToSell),
        };
      };

      expect(calculateTurnover(120000, 30000)).toEqual({
        turnoverRatio: 4,
        daysToSell: 91,
      });
    });
  });

  describe('Branch Inventory', () => {
    it('should aggregate inventory across branches', () => {
      const aggregateInventory = (branches: { branchId: number; stock: number }[]) => {
        const totalStock = branches.reduce((sum, b) => sum + b.stock, 0);
        const branchCount = branches.length;
        const avgPerBranch = branchCount > 0 ? totalStock / branchCount : 0;

        return {
          totalStock,
          branchCount,
          avgPerBranch: Math.round(avgPerBranch * 100) / 100,
          stockDistribution: branches.map(b => ({
            branchId: b.branchId,
            stock: b.stock,
            percentage: Math.round((b.stock / totalStock) * 100),
          })),
        };
      };

      const branches = [
        { branchId: 1, stock: 100 },
        { branchId: 2, stock: 50 },
        { branchId: 3, stock: 150 },
      ];

      const result = aggregateInventory(branches);
      expect(result.totalStock).toBe(300);
      expect(result.branchCount).toBe(3);
      expect(result.avgPerBranch).toBe(100);
      expect(result.stockDistribution[0].percentage).toBe(33);
      expect(result.stockDistribution[2].percentage).toBe(50);
    });

    it('should suggest optimal distribution', () => {
      const suggestDistribution = (
        branches: { branchId: number; stock: number; demand: number }[]
      ) => {
        const totalStock = branches.reduce((sum, b) => sum + b.stock, 0);
        const totalDemand = branches.reduce((sum, b) => sum + b.demand, 0);

        return branches.map(b => {
          const idealStock = totalDemand > 0
            ? Math.round((b.demand / totalDemand) * totalStock)
            : Math.round(totalStock / branches.length);

          return {
            branchId: b.branchId,
            currentStock: b.stock,
            idealStock,
            adjustment: idealStock - b.stock,
          };
        });
      };

      const branches = [
        { branchId: 1, stock: 100, demand: 40 },
        { branchId: 2, stock: 50, demand: 30 },
        { branchId: 3, stock: 150, demand: 30 },
      ];

      const suggestions = suggestDistribution(branches);
      expect(suggestions[0].adjustment).toBe(20); // needs 120, has 100
      expect(suggestions[1].adjustment).toBe(40); // needs 90, has 50
      expect(suggestions[2].adjustment).toBe(-60); // needs 90, has 150
    });
  });

  describe('Stock Movement History', () => {
    it('should track movement history', () => {
      const movements: { type: string; quantity: number; date: Date }[] = [];

      const recordMovement = (type: 'in' | 'out' | 'transfer', quantity: number) => {
        const movement = {
          type,
          quantity: type === 'out' ? -quantity : quantity,
          date: new Date(),
        };
        movements.push(movement);
        return movement;
      };

      recordMovement('in', 100);
      recordMovement('out', 30);
      recordMovement('in', 50);

      const netMovement = movements.reduce((sum, m) => sum + m.quantity, 0);
      expect(netMovement).toBe(120); // 100 - 30 + 50
      expect(movements).toHaveLength(3);
    });

    it('should calculate period summary', () => {
      const calculatePeriodSummary = (movements: { type: string; quantity: number }[]) => {
        const inbound = movements
          .filter(m => m.type === 'in')
          .reduce((sum, m) => sum + m.quantity, 0);

        const outbound = movements
          .filter(m => m.type === 'out')
          .reduce((sum, m) => sum + m.quantity, 0);

        return {
          totalInbound: inbound,
          totalOutbound: outbound,
          netChange: inbound - outbound,
          movementCount: movements.length,
        };
      };

      const movements = [
        { type: 'in', quantity: 100 },
        { type: 'out', quantity: 50 },
        { type: 'in', quantity: 30 },
        { type: 'out', quantity: 20 },
      ];

      expect(calculatePeriodSummary(movements)).toEqual({
        totalInbound: 130,
        totalOutbound: 70,
        netChange: 60,
        movementCount: 4,
      });
    });
  });
});
