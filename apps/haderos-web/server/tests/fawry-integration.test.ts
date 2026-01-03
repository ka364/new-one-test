
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UnifiedPaymentService, PaymentRequest } from '../services/unified-payment.service';
import { db } from '../db';

// Mock DB
vi.mock('../db', async () => {
    return {
        db: {
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn(),
            insert: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            returning: vi.fn(),
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
        },
    };
});

// Mock Global Fetch
global.fetch = vi.fn();

describe('Fawry Integration (UnifiedPaymentService)', () => {
    let service: UnifiedPaymentService;

    beforeEach(() => {
        service = new UnifiedPaymentService();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should successfully initiate a Fawry Payment (Reference Code)', async () => {
        // 1. Mock DB Provider Lookup
        (db.select as any).mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                        {
                            id: 3,
                            code: 'fawry',
                            name: 'Fawry',
                            type: 'reference_code',
                            isActive: true,
                            minAmount: 10,
                            maxAmount: 5000,
                            fixedFee: 5,
                            percentageFee: 0,
                            config: {
                                merchantCode: 'mock-merchant',
                                securityKey: 'mock-secret',
                                baseUrl: 'https://atfawry.test'
                            }
                        }
                    ])
                })
            })
        });

        // 2. Mock DB Transaction Insert
        (db.insert as any).mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 200, transactionNumber: 'PAY-FWRY-999' }])
            })
        });

        // 3. Mock DB Transaction Update
        (db.update as any).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue({})
            })
        });

        // 4. Mock Fawry API Response
        const mockFawryResponse = {
            type: 'ChargeResponse',
            referenceNumber: '987654321',
            merchantRefNum: 'PAY-FWRY-999',
            expirationTime: 1735689600000, // Some future timestamp
            statusCode: 200,
            statusDescription: 'Operation done successfully'
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockFawryResponse
        });

        // 5. Execute
        const request: PaymentRequest = {
            orderId: 600,
            orderNumber: 'ORD-600',
            amount: 500.00,
            providerCode: 'fawry',
            customer: {
                name: 'Fawry Customer',
                phone: '01234567890',
                email: 'fawry@test.com'
            }
        };

        const result = await service.createPayment(request);

        // 6. Assertions
        expect(result.success).toBe(true);
        expect(result.referenceCode).toBe('987654321');
        expect(result.status).toBe('processing');

        // Verify Fetch Call
        expect(global.fetch).toHaveBeenCalledTimes(1);
        const fetchCall = (global.fetch as any).mock.calls[0];
        expect(fetchCall[0]).toBe('https://atfawry.test');

        const body = JSON.parse(fetchCall[1].body);
        expect(body.merchantCode).toBe('mock-merchant');
        expect(body.paymentMethod).toBe('PAYATFAWRY');
        expect(body.amount).toBe(500.00);
    });
});
