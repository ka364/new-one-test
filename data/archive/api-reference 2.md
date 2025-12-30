# 📡 API Reference - NOW SHOES System

Complete reference for all tRPC APIs in the NOW SHOES system.

---

## 🔐 Authentication

All protected procedures require authentication via Manus OAuth. Include the session cookie in requests.

### Auth Router (`trpc.auth.*`)

#### `auth.me`
Get current authenticated user information.

**Type:** Query (Protected)

**Input:** None

**Output:**
```typescript
{
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  openId: string;
  createdAt: Date;
}
```

**Example:**
```typescript
const { data: user } = trpc.auth.me.useQuery();
```

---

#### `auth.logout`
Logout current user and clear session.

**Type:** Mutation (Protected)

**Input:** None

**Output:**
```typescript
{ success: boolean }
```

**Example:**
```typescript
const logoutMutation = trpc.auth.logout.useMutation({
  onSuccess: () => {
    window.location.href = '/';
  },
});
```

---

## 👥 HR Management APIs

### HR Router (`trpc.hr.*`)

#### `hr.createSupervisor`
Create a new supervisor account (max 7 per base account).

**Type:** Mutation (Protected)

**Input:**
```typescript
{
  fullName: string;
  nationalId: string; // 14 digits
  phoneNumber: string;
  email?: string;
  jobTitle: string;
  department: string;
  salary: number;
}
```

**Output:**
```typescript
{
  id: number;
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  email: string | null;
  jobTitle: string;
  department: string;
  salary: string;
  role: 'supervisor';
  createdAt: Date;
}
```

**Example:**
```typescript
const createSupervisor = trpc.hr.createSupervisor.useMutation({
  onSuccess: (data) => {
    console.log('Supervisor created:', data.id);
  },
});

createSupervisor.mutate({
  fullName: 'أحمد محمد',
  nationalId: '12345678901234',
  phoneNumber: '+201234567890',
  email: 'ahmed@example.com',
  jobTitle: 'مشرف المبيعات',
  department: 'المبيعات',
  salary: 5000,
});
```

---

#### `hr.getSupervisors`
Get all supervisors for the current base account.

**Type:** Query (Protected)

**Input:** None

**Output:**
```typescript
Array<{
  id: number;
  fullName: string;
  nationalId: string;
  phoneNumber: string;
  email: string | null;
  jobTitle: string;
  department: string;
  salary: string;
  role: 'supervisor';
  childrenCount: number; // Number of employees under this supervisor
  createdAt: Date;
}>
```

**Example:**
```typescript
const { data: supervisors } = trpc.hr.getSupervisors.useQuery();
```

---

#### `hr.registerEmployee`
Register a new employee under a supervisor (max 7 per supervisor).

**Type:** Mutation (Protected)

**Input:**
```typescript
{
  // Personal Information (from ID card)
  fullName: string;
  nationalId: string; // 14 digits
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  religion?: string;
  maritalStatus?: string;
  address?: string;
  governorate?: string;
  
  // Contact
  phoneNumber: string;
  email?: string;
  
  // Employment
  jobTitle: string;
  department: string;
  salary: number;
  contractType?: 'permanent' | 'temporary' | 'internship';
  
  // Documents (S3 URLs)
  nationalIdFrontUrl: string;
  nationalIdBackUrl: string;
  militaryCertificateUrl?: string; // Required for males
  personalPhotoUrl: string;
  
  // OTP Verification
  otpCode: string;
  
  // GPS Location
  latitude?: number;
  longitude?: number;
}
```

**Output:**
```typescript
{
  employeeId: number;
  success: boolean;
  message: string;
}
```

**Example:**
```typescript
const registerEmployee = trpc.hr.registerEmployee.useMutation({
  onSuccess: (data) => {
    console.log('Employee registered:', data.employeeId);
  },
});

registerEmployee.mutate({
  fullName: 'محمد أحمد',
  nationalId: '29012345678901',
  phoneNumber: '+201234567890',
  jobTitle: 'موظف مبيعات',
  department: 'المبيعات',
  salary: 3000,
  nationalIdFrontUrl: 'https://s3.../id-front.jpg',
  nationalIdBackUrl: 'https://s3.../id-back.jpg',
  personalPhotoUrl: 'https://s3.../photo.jpg',
  otpCode: '123456',
});
```

---

#### `hr.getEmployeeById`
Get employee details by ID.

**Type:** Query (Protected)

**Input:**
```typescript
{ id: number }
```

**Output:**
```typescript
{
  id: number;
  fullName: string;
  nationalId: string;
  dateOfBirth: string | null;
  gender: string | null;
  phoneNumber: string;
  email: string | null;
  jobTitle: string;
  department: string;
  salary: string;
  hireDate: Date;
  contractType: string | null;
  isActive: boolean;
  documentsVerified: boolean;
  verificationStatus: string;
  createdAt: Date;
}
```

**Example:**
```typescript
const { data: employee } = trpc.hr.getEmployeeById.useQuery({ id: 123 });
```

---

### OTP Router (`trpc.otp.*`)

#### `otp.sendOTP`
Send OTP code to employee (Email or SMS based on employee count).

**Type:** Mutation (Public)

**Input:**
```typescript
{
  phoneNumber: string;
  email?: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  message: string;
  method: 'email' | 'sms';
  expiresIn: number; // seconds (300 = 5 minutes)
  otpCode?: string; // Only in development mode
}
```

**Example:**
```typescript
const sendOTP = trpc.otp.sendOTP.useMutation({
  onSuccess: (data) => {
    console.log(`OTP sent via ${data.method}`);
  },
});

sendOTP.mutate({
  phoneNumber: '+201234567890',
  email: 'user@example.com',
});
```

---

#### `otp.verifyOTP`
Verify OTP code.

**Type:** Mutation (Public)

**Input:**
```typescript
{
  phoneNumber: string;
  otpCode: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Example:**
```typescript
const verifyOTP = trpc.otp.verifyOTP.useMutation({
  onSuccess: () => {
    console.log('OTP verified successfully');
  },
});

verifyOTP.mutate({
  phoneNumber: '+201234567890',
  otpCode: '123456',
});
```

---

## 📦 NOW SHOES Business APIs

### NOW SHOES Router (`trpc.nowshoes.*`)

#### `nowshoes.getAllProducts`
Get all products in the catalog.

**Type:** Query (Public)

**Input:** None

**Output:**
```typescript
Array<{
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}>
```

**Example:**
```typescript
const { data: products } = trpc.nowshoes.getAllProducts.useQuery();
```

---

#### `nowshoes.getProductById`
Get product details by ID.

**Type:** Query (Public)

**Input:**
```typescript
{ id: number }
```

**Output:**
```typescript
{
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
}
```

**Example:**
```typescript
const { data: product } = trpc.nowshoes.getProductById.useQuery({ id: 1 });
```

---

#### `nowshoes.getInventory`
Get current inventory levels for all products.

**Type:** Query (Public)

**Input:** None

**Output:**
```typescript
Array<{
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  lastUpdated: Date;
}>
```

**Example:**
```typescript
const { data: inventory } = trpc.nowshoes.getInventory.useQuery();
```

---

#### `nowshoes.getLowStockItems`
Get products with low stock (quantity <= threshold).

**Type:** Query (Public)

**Input:** None

**Output:**
```typescript
Array<{
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  lowStockThreshold: number;
  lastUpdated: Date;
}>
```

**Example:**
```typescript
const { data: lowStock } = trpc.nowshoes.getLowStockItems.useQuery();
```

---

#### `nowshoes.updateInventoryQuantity`
Update inventory quantity for a product.

**Type:** Mutation (Protected, Admin only)

**Input:**
```typescript
{
  productId: number;
  quantity: number;
  reason?: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  newQuantity: number;
}
```

**Example:**
```typescript
const updateInventory = trpc.nowshoes.updateInventoryQuantity.useMutation({
  onSuccess: (data) => {
    console.log('New quantity:', data.newQuantity);
  },
});

updateInventory.mutate({
  productId: 1,
  quantity: 100,
  reason: 'Restock from supplier',
});
```

---

#### `nowshoes.getAllOrders`
Get all orders with optional filters.

**Type:** Query (Public)

**Input:**
```typescript
{
  status?: string;
  limit?: number;
  offset?: number;
}
```

**Output:**
```typescript
{
  orders: Array<{
    id: number;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    totalAmount: string;
    status: string;
    orderDate: Date;
  }>;
  total: number;
}
```

**Example:**
```typescript
const { data } = trpc.nowshoes.getAllOrders.useQuery({
  status: 'pending',
  limit: 50,
  offset: 0,
});
```

---

#### `nowshoes.createOrder`
Create a new order.

**Type:** Mutation (Protected)

**Input:**
```typescript
{
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
}
```

**Output:**
```typescript
{
  orderId: number;
  orderNumber: string;
  totalAmount: number;
}
```

**Example:**
```typescript
const createOrder = trpc.nowshoes.createOrder.useMutation({
  onSuccess: (data) => {
    console.log('Order created:', data.orderNumber);
  },
});

createOrder.mutate({
  customerName: 'أحمد محمد',
  customerPhone: '+201234567890',
  shippingAddress: 'القاهرة، مصر',
  items: [
    { productId: 1, quantity: 2, price: 500 },
    { productId: 2, quantity: 1, price: 750 },
  ],
});
```

---

#### `nowshoes.getDailySalesStats`
Get daily sales statistics.

**Type:** Query (Public)

**Input:** None

**Output:**
```typescript
{
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  date: string;
}
```

**Example:**
```typescript
const { data: stats } = trpc.nowshoes.getDailySalesStats.useQuery();
```

---

#### `nowshoes.getTopSellingProducts`
Get top 5 selling products.

**Type:** Query (Public)

**Input:** None

**Output:**
```typescript
Array<{
  productId: number;
  productName: string;
  productSku: string;
  totalQuantitySold: number;
  totalRevenue: number;
}>
```

**Example:**
```typescript
const { data: topProducts } = trpc.nowshoes.getTopSellingProducts.useQuery();
```

---

## 🚚 Shipment Tracking APIs

### Shipments Router (`trpc.shipments.*`)

#### `shipments.list`
Get shipments list with filters and pagination.

**Type:** Query (Public)

**Input:**
```typescript
{
  company?: string; // 'Bosta' | 'GT Express' | 'Eshhnly'
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: string;
  search?: string; // Search in tracking number, order number, customer name, phone
  limit?: number; // Default: 50
  offset?: number; // Default: 0
}
```

**Output:**
```typescript
{
  shipments: Array<{
    id: number;
    company: string;
    tracking_number: string | null;
    order_number: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    quantity: number;
    amount: number;
    shipment_date: string | null;
    status: string | null;
    file_source: string | null;
    created_at: Date;
  }>;
  total: number;
  hasMore: boolean;
}
```

**Example:**
```typescript
const { data } = trpc.shipments.list.useQuery({
  company: 'Bosta',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  limit: 50,
  offset: 0,
});
```

---

#### `shipments.stats`
Get shipment statistics.

**Type:** Query (Public)

**Input:** None

**Output:**
```typescript
{
  total: number;
  byCompany: Array<{
    company: string;
    count: number;
  }>;
  byDate: Array<{
    shipment_date: string;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}
```

**Example:**
```typescript
const { data: stats } = trpc.shipments.stats.useQuery();
```

---

#### `shipments.export`
Export shipments to Excel file.

**Type:** Mutation (Protected)

**Input:**
```typescript
{
  company?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
}
```

**Output:**
```typescript
{
  excelFile: string; // Base64 encoded Excel file
  filename: string;
  count: number;
}
```

**Example:**
```typescript
const exportShipments = trpc.shipments.export.useMutation({
  onSuccess: (data) => {
    // Download Excel file
    const link = document.createElement('a');
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excelFile}`;
    link.download = data.filename;
    link.click();
  },
});

exportShipments.mutate({
  company: 'Bosta',
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});
```

---

## 💰 Monthly Employee Accounts APIs

### Monthly Accounts Router (`trpc.monthlyAccounts.*`)

#### `monthlyAccounts.generateAccounts`
Generate monthly employee accounts (Admin only).

**Type:** Mutation (Protected, Admin only)

**Input:**
```typescript
{
  month: string; // YYYY-MM
  accountsData: Array<{
    employeeName: string;
    department: string;
    role: string;
  }>;
}
```

**Output:**
```typescript
{
  success: boolean;
  accountsCreated: number;
  excelFile: string; // Base64 encoded Excel with credentials
  filename: string;
}
```

**Example:**
```typescript
const generateAccounts = trpc.monthlyAccounts.generateAccounts.useMutation({
  onSuccess: (data) => {
    // Download credentials Excel
    const link = document.createElement('a');
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${data.excelFile}`;
    link.download = data.filename;
    link.click();
  },
});

generateAccounts.mutate({
  month: '2025-01',
  accountsData: [
    { employeeName: 'أحمد شوقي', department: 'البرمجة', role: 'Manager' },
    { employeeName: 'فريق البرمجة', department: 'البرمجة', role: 'Developer' },
  ],
});
```

---

#### `monthlyAccounts.employeeLogin`
Employee login with monthly account.

**Type:** Mutation (Public)

**Input:**
```typescript
{
  username: string; // emp_YYYYMM_XXX
  password: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  employeeId: number;
  employeeName: string;
  month: string;
  redirectTo: string;
}
```

**Example:**
```typescript
const employeeLogin = trpc.monthlyAccounts.employeeLogin.useMutation({
  onSuccess: (data) => {
    window.location.href = data.redirectTo;
  },
});

employeeLogin.mutate({
  username: 'emp_202512_001',
  password: 'SecurePass123!',
});
```

---

## 🔄 Error Handling

All tRPC procedures may throw errors. Handle them appropriately:

```typescript
const mutation = trpc.hr.createSupervisor.useMutation({
  onError: (error) => {
    if (error.data?.code === 'FORBIDDEN') {
      toast.error('ليس لديك صلاحية لتنفيذ هذا الإجراء');
    } else if (error.data?.code === 'BAD_REQUEST') {
      toast.error(error.message);
    } else {
      toast.error('حدث خطأ غير متوقع');
    }
  },
});
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | User not authenticated |
| `FORBIDDEN` | User lacks required permissions |
| `BAD_REQUEST` | Invalid input data |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_SERVER_ERROR` | Server error |

---

## 🔄 Optimistic Updates

For better UX, use optimistic updates for mutations:

```typescript
const utils = trpc.useUtils();

const createMutation = trpc.hr.createSupervisor.useMutation({
  onMutate: async (newSupervisor) => {
    // Cancel outgoing queries
    await utils.hr.getSupervisors.cancel();
    
    // Snapshot previous value
    const previous = utils.hr.getSupervisors.getData();
    
    // Optimistically update
    utils.hr.getSupervisors.setData(undefined, (old) => [
      ...(old || []),
      { ...newSupervisor, id: Date.now(), createdAt: new Date() },
    ]);
    
    return { previous };
  },
  
  onError: (err, newSupervisor, context) => {
    // Rollback on error
    utils.hr.getSupervisors.setData(undefined, context?.previous);
  },
  
  onSettled: () => {
    // Refetch to ensure sync
    utils.hr.getSupervisors.invalidate();
  },
});
```

---

**Last Updated:** December 18, 2025  
**Version:** 1.0  
**Maintained by:** Development Team
