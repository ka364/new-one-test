
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { phoneSalesRouter } from './phone-sales';
import { db } from '../db';

// Mock the DB
vi.mock('../db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnValue([{ id: 'mock-uuid', name: 'Test Agent' }]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
    }
}));

describe('Phone Sales Router (Verification)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('1. Create Agent should Insert into DB', async () => {
        const caller = phoneSalesRouter.createCaller({});
        const input = {
            name: 'Ahmed Agent',
            email: 'ahmed@haderos.com',
            languages: ['ar', 'en']
        };

        const result = await caller.createAgent(input);

        expect(db.insert).toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.agent).toBeDefined();
    });

    it('2. Get Agents should Select from DB', async () => {
        // Mock return value for select
        (db.orderBy as any).mockResolvedValueOnce([
            { id: 1, name: 'Agent 1' },
            { id: 2, name: 'Agent 2' }
        ]);

        const caller = phoneSalesRouter.createCaller({});
        const result = await caller.getAgents({});

        expect(db.select).toHaveBeenCalled();
        expect(db.from).toHaveBeenCalled();
        expect(result).toHaveLength(2);
    });

    it('3. Create Lead should Insert and Log Activity', async () => {
        const caller = phoneSalesRouter.createCaller({});
        const input = {
            firstName: 'New',
            phone: '01000000000',
            source: 'website' as const // fix type literal
        };

        await caller.createLead(input);

        // Should insert lead AND insert activity
        expect(db.insert).toHaveBeenCalledTimes(2);
    });
});
