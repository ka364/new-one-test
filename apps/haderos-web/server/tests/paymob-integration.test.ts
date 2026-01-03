
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UnifiedPaymentService, PaymentRequest } from '../services/unified-payment.service';
import { db } from '../db';
import { paymentProviders, paymentTransactions } from '../../drizzle/schema-payments';
import { eq } from 'drizzle-orm';

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

describe('PayMob Integration (UnifiedPaymentService)', () => {
    let service: UnifiedPaymentService;

    beforeEach(() => {
        service = new UnifiedPaymentService();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should successfully initiate a Card Payment', async () => {
        // 1. Mock DB Provider Lookup
        (db.select as any).mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                        {
                            id: 1,
                            code: 'paymob_card',
                            name: 'Credit Card',
                            type: 'card',
                            isActive: true,
                            minAmount: 10,
                            maxAmount: 100000,
                            fixedFee: 0,
                            percentageFee: 0,
                            config: {
                                apiKey: 'mock-api-key',
                                iframeId: '12345',
                                cardIntegrationId: '67890'
                            }
                        }
                    ])
                })
            })
        });

        // 2. Mock DB Transaction Insert
        (db.insert as any).mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 100, transactionNumber: 'PAY-MOCK-123' }])
            })
        });

        // 3. Mock DB Transaction Update
        (db.update as any).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue({})
            })
        });

        // 4. Mock PayMob API Calls (Step 1, 2, 3)
        const mockAuthResponse = { token: 'mock-auth-token' };
        const mockOrderResponse = { id: 99999 };
        const mockKeyResponse = { token: 'mock-payment-key' };

        (global.fetch as any)
            .mockResolvedValueOnce({ ok: true, json: async () => mockAuthResponse }) // Auth
            .mockResolvedValueOnce({ ok: true, json: async () => mockOrderResponse }) // Order
            .mockResolvedValueOnce({ ok: true, json: async () => mockKeyResponse });  // Key

        // 5. Execute
        const request: PaymentRequest = {
            orderId: 501,
            orderNumber: 'ORD-501',
            amount: 250.00,
            providerCode: 'paymob_card',
            customer: {
                name: 'Ahmed Shawky',
                phone: '01000000000',
                email: 'test@haderos.com'
            }
        };

        const result = await service.createPayment(request);

        // 6. Assertions
        expect(result.success).toBe(true);
        expect(result.status).toBe('processing');
        expect(result.paymentUrl).toBe('https://accept.paymob.com/api/acceptance/iframes/12345?payment_token=mock-payment-key');

        // Verify 3 external calls were made
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://accept.paymob.com/api/auth/tokens', expect.any(Object));
    });

    it('should successfully initiate a Mobile Wallet Payment', async () => {
        // 1. Mock DB Provider for VF Cash
        (db.select as any).mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                        {
                            id: 2,
                            code: 'vodafone_cash',
                            name: 'Vodafone Cash',
                            type: 'mobile_wallet',
                            isActive: true,
                            minAmount: 5,
                            maxAmount: 10000,
                            config: {
                                apiKey: 'mock-api-key',
                                vodafoneIntegrationId: '11111'
                            }
                        }
                    ])
                })
            })
        });

        // 2. Mock DB Transaction Insert
        (db.insert as any).mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 101, transactionNumber: 'PAY-WALLET-123' }])
            })
        });

        // 3. Mock PayMob API Calls (Auth, Order, Key, Pay)
        (global.fetch as any)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'auth-token' }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 88888 }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'pay-token' }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ redirect_url: 'https://paymob.com/wallet/pay' }) });

        // 4. Update Mock for Transaction (needed for set call)
        (db.update as any).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue({})
            })
        });

        const result = await service.createPayment({
            orderId: 502,
            orderNumber: 'ORD-502',
            amount: 100,
            providerCode: 'vodafone_cash',
            customer: { name: 'VF User', phone: '01012345678' }
        });

        expect(result.success).toBe(true);
        expect(result.paymentUrl).toBe('https://paymob.com/wallet/pay');
        expect(global.fetch).toHaveBeenCalledTimes(4); // Auth + Order + Key + Pay
    });
});
