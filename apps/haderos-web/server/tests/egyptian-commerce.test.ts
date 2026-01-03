
import { test, expect, vi, describe, beforeEach } from 'vitest';
import { egyptianCommerceRouter } from '../routers/egyptian-commerce';
// @ts-ignore
import { db } from '../db';

// We need a way to resolved different data at the end of the chain.
// Vitest mocks return 'this' which is the same object. 
// We can mock specific methods to return specific Promises when they are the "end" of the chain.

vi.mock('../db', () => {
    const mockBuilder = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
    };

    return {
        db: {
            ...mockBuilder,
            select: vi.fn().mockReturnThis(),
        },
        requireDb: vi.fn().mockResolvedValue({
            ...mockBuilder,
            select: vi.fn().mockReturnThis(),
        })
    };
});

describe('Egyptian Commerce Router', () => {
    const caller = egyptianCommerceRouter.createCaller({});

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('getCategories should query DB', async () => {
        const mockCategories = [{ id: '1', code: 'GROCERY', nameAr: 'Grocery' }];

        // Chain: select -> from -> where -> orderBy -> RESULT
        // We mocked everything to return 'this'. 
        // We need 'orderBy' to return the data promise.

        // @ts-ignore
        db.orderBy.mockResolvedValueOnce(mockCategories);

        const result = await caller.categories.getAll({});

        expect(result.success).toBe(true);
        expect(db.select).toHaveBeenCalled();
        expect(db.from).toHaveBeenCalled();
        console.log('Categories Test Passed');
    });

    test('getStats should query orders table', async () => {
        const mockOrderStats = [{ count: 100, totalRevenue: '50000' }];
        const mockActiveStores = [{ count: 5 }];

        const requireDbMock = await import('../db').then(m => m.requireDb);
        // @ts-ignore
        const dbMock = await requireDbMock();

        // Query 1: select -> from -> RESULT
        // dbMock.from needs to return mockOrderStats Promise ONCE.
        // Query 2: select -> from -> where -> RESULT
        // dbMock.where needs to return mockActiveStores Promise ONCE. 
        // AND dbMock.from needs to return 'this' (builder) for the 2nd query.

        // So 'from' returns [DataPromise, Builder].
        // But 'select' is called start of each query.

        // Let's reset the mocks to be safe and specific
        dbMock.from
            .mockResolvedValueOnce(mockOrderStats) // 1st call (Orders): Ends at from()
            .mockReturnValueOnce(dbMock);          // 2nd call (Stores): Returns builder to continue to where()

        dbMock.where.mockResolvedValueOnce(mockActiveStores); // 2nd call (Stores): Ends at where()

        const result = await caller.analytics.getStats({});

        expect(result.success).toBe(true);
        expect(result.stats.totalOrders).toBe(100);
        expect(result.stats.totalRevenue).toBe(50000);
        expect(result.stats.activeDarkStores).toBe(5);

        console.log('Analytics Stats Test Passed');
    });

    test('createDarkStore should insert into DB', async () => {
        const input = {
            code: 'DS-001',
            nameAr: 'Main Store',
            governorate: 'Cairo',
            city: 'Nasr City',
            district: 'D1'
        };

        // Chain: insert -> values -> returning -> RESULT
        // @ts-ignore
        db.returning.mockResolvedValueOnce([{ id: 'new-id', ...input }]);

        const result = await caller.darkStores.create(input);

        expect(result.success).toBe(true);
        expect(db.insert).toHaveBeenCalled();
        console.log('Create Dark Store Test Passed');
    });
});

