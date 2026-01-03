
import { v4 as uuidv4 } from 'uuid';
import {
    createEInvoice,
    updateEInvoiceStatus,
    getEInvoiceByUuid,
    getOrderById,
    Order,
    EInvoice
} from '../db';
import { eInvoices } from '../../drizzle/schema-eta';
import { eq } from 'drizzle-orm';
import axios from 'axios';

// Configuration
const ETA_CONFIG = {
    baseUrl: process.env.ETA_API_URL || 'https://api.preprod.invoicing.eta.gov.eg',
    clientId: process.env.ETA_CLIENT_ID || '',
    clientSecret: process.env.ETA_CLIENT_SECRET || '',
    tokenUrl: process.env.ETA_TOKEN_URL || 'https://id.preprod.eta.gov.eg/connect/token',
    issuerName: process.env.ETA_ISSUER_NAME || 'HADEROS LLC',
    activityCode: process.env.ETA_ACTIVITY_CODE || '4791', // Retail sale via mail order houses or via Internet
    taxCode: process.env.ETA_TAX_CODE || '', // RIN
    branchId: process.env.ETA_BRANCH_ID || '0',
};

export class ETAService {
    private static instance: ETAService;
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;

    private constructor() { }

    public static getInstance(): ETAService {
        if (!ETAService.instance) {
            ETAService.instance = new ETAService();
        }
        return ETAService.instance;
    }

    /**
     * Login to ETA Identity Server to get Access Token
     */
    async login(): Promise<string> {
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return this.accessToken;
        }

        try {
            console.log('Authenticating with ETA...');
            // In a real scenario, we perform a POST request to the IDP
            // const response = await axios.post(ETA_CONFIG.tokenUrl, ...);

            // MOCK TOKEN FOR NOW
            this.accessToken = 'mock_access_token_' + uuidv4();
            this.tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hour

            return this.accessToken;
        } catch (error) {
            console.error('ETA Login Failed:', error);
            throw new Error('Failed to authenticate with ETA');
        }
    }

    /**
     * Create an E-Invoice from a System Order
     */
    async createInvoiceForOrder(orderId: number): Promise<EInvoice> {
        const order = await getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        const uuid = uuidv4();

        // 1. Serialize to JSON
        const documentJson = this.serializeOrderToETA(order as any, uuid);

        // 2. Save to DB
        const insertResult = await createEInvoice({
            orderId: order.id,
            uuid: uuid,
            status: 'pending',
            metadata: {
                etaVersion: '1.0',
                documentJson: documentJson
            }
        });

        // 3. Return the stored object (fetch it back to be safe)
        const stored = await getEInvoiceByUuid(uuid);
        if (!stored) throw new Error('Failed to retrieve created invoice');

        return stored;
    }

    /**
     * Sign the invoice (Requires local signer or Hardware Token)
     * This is a stub implementation. In production this requires CAdES-BES signing.
     */
    async signInvoice(uuid: string): Promise<any> {
        const invoice = await getEInvoiceByUuid(uuid);
        if (!invoice) throw new Error('Invoice not found');
        if (invoice.status !== 'pending') throw new Error('Invoice is not in pending state');

        const documentJson = (invoice.metadata as any)?.documentJson;

        // START STUB SIGNING
        const signature = 'MOCK_SIGNATURE_BASE64_STRING_BY_HADEROS_SIGNER';
        const signedBlock = {
            ...documentJson,
            signatures: [{
                signatureType: 'I',
                value: signature
            }]
        };
        // END STUB SIGNING

        await updateEInvoiceStatus(invoice.id, 'pending', {
            signedJson: signedBlock
        });

        return signedBlock;
    }

    /**
     * Submit the signed invoice to ETA
     */
    async submitInvoice(uuid: string): Promise<EInvoice> {
        const invoice = await getEInvoiceByUuid(uuid);
        if (!invoice) throw new Error('Invoice not found');

        let signedJson = invoice.signedJson;

        // Auto-sign if not signed yet (for testing flow)
        if (!signedJson) {
            signedJson = await this.signInvoice(uuid);
        }

        const token = await this.login();

        try {
            console.log(`Submitting Invoice ${uuid} to ETA...`);

            // MOCK SUBMISSION
            // const response = await axios.post(`${ETA_CONFIG.baseUrl}/api/v1/documentsubmissions`, { documents: [signedJson] }, ...);

            const mockSubmissionId = uuidv4();

            await updateEInvoiceStatus(invoice.id, 'submitted', {
                submissionUuid: mockSubmissionId,
                // We would also store `status: 'valid'` if synchronous, or wait for callback
            });

            // Simulate immediate validation for MVP
            await updateEInvoiceStatus(invoice.id, 'valid', {
                longId: 'ETA_LONG_ID_' + Math.floor(Math.random() * 1000000),
                receipt: {
                    submissionId: mockSubmissionId,
                    acceptedDocuments: [uuid],
                    rejectedDocuments: []
                }
            });

            const updated = await getEInvoiceByUuid(uuid);
            return updated!;

        } catch (error) {
            console.error('ETA Submission Failed:', error);
            await updateEInvoiceStatus(invoice.id, 'pending', { // Revert to pending implies retry, or 'invalid'
                rejectionReasons: { error: 'Submission failed', details: error }
            });
            throw error;
        }
    }

    /**
     * Helper: Map HADEROS Order to ETA Document Structure
     */
    private serializeOrderToETA(order: Order, uuid: string): any {
        // This is a simplified mapping. Real mapping requires strict adherence to SDK types.
        return {
            "issuer": {
                "address": {
                    "branchID": ETA_CONFIG.branchId,
                    "country": "EG",
                    "governate": "Cairo",
                    "regionCity": "Nasr City",
                    "street": "Haderos HQ Street",
                    "buildingNumber": "10"
                },
                "type": "B",
                "id": ETA_CONFIG.taxCode || "100-200-300",
                "name": ETA_CONFIG.issuerName
            },
            "receiver": {
                "address": {
                    "country": "EG",
                    "governate": "Cairo",
                    "regionCity": "New Cairo",
                    "street": order.shippingAddress || "Retail Customer Address",
                    "buildingNumber": "1"
                },
                "type": "P", // Person
                "id": "", // National ID if available
                "name": order.customerName
            },
            "documentType": "I", // Invoice
            "documentTypeVersion": "1.0",
            "dateTimeIssued": new Date().toISOString(),
            "taxpayerActivityCode": ETA_CONFIG.activityCode,
            "internalID": order.orderNumber, // Using Order Number as Internal ID
            "purchaseOrderReference": order.orderNumber,
            "salesOrderReference": "",
            "payment": {
                "bankName": "",
                "bankAddress": "",
                "bankAccountNo": "",
                "bankAccountIBAN": "",
                "swiftCode": "",
                "terms": ""
            },
            "delivery": {
                "approach": "",
                "packaging": "",
                "dateValidity": "",
                "exportPort": "",
                "grossWeight": 0,
                "netWeight": 0,
                "terms": ""
            },
            "invoiceLines": [
                // We would map orderItems here. For now, a dummy line.
                {
                    "description": order.productName,
                    "itemType": "GS1",
                    "itemCode": "1000",
                    "unitType": "EA",
                    "quantity": order.quantity,
                    "internalCode": "ITM-001",
                    "salesTotal": order.totalAmount, // Simplified
                    "total": order.totalAmount,
                    "valueDifference": 0,
                    "totalTaxableFees": 0,
                    "netTotal": order.totalAmount,
                    "itemsDiscount": 0,
                    "unitValue": {
                        "currencySold": "EGP",
                        "amountEGP": order.unitPrice,
                        "amountSold": 0,
                        "currencyExchangeRate": 0
                    },
                    "discount": {
                        "rate": 0,
                        "amount": 0
                    },
                    "taxableItems": [
                        {
                            "taxType": "T1", // VAT
                            "amount": 0.14 * (order.totalAmount as any), // Rough calc
                            "subType": "V009",
                            "rate": 14
                        }
                    ]
                }
            ],
            "totalDiscountAmount": 0,
            "totalSalesAmount": order.totalAmount,
            "netAmount": order.totalAmount,
            "taxTotals": [
                {
                    "taxType": "T1",
                    "amount": 0.14 * (order.totalAmount as any)
                }
            ],
            "totalAmount": (order.totalAmount as any) * 1.14, // Rough +VAT
            "extraDiscountAmount": 0,
            "totalItemsDiscountAmount": 0,
            "extraReceiptDiscountAmount": 0,
        };
    }
}

export const etaService = ETAService.getInstance();
