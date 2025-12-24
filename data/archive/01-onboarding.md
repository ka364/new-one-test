# 📖 NOW SHOES System - Onboarding Guide for New Developers

Welcome to the NOW SHOES development team! This guide will help you get started with the system quickly and efficiently.

---

## 🎯 What is NOW SHOES?

NOW SHOES is a comprehensive business management system built for a shoe e-commerce company. The system includes:

- **E-Commerce Management:** Product catalog, inventory, orders, and customer management
- **HR Management System:** Employee registration, document verification, hierarchical structure (3 base accounts → 7 supervisors → 49 employees)
- **Shipment Tracking:** Integration with shipping companies (Bosta, GT Express, Eshhnly)
- **Monthly Employee Accounts:** Secure monthly account generation for temporary employees
- **OTP Verification:** Hybrid system (Email for <25 employees, SMS for ≥25)
- **Document Verification:** AI-powered extraction from Egyptian National ID cards

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Routing:** Wouter (lightweight React router)
- **State Management:** React hooks + tRPC queries
- **Language:** Arabic (RTL) with full internationalization

### Backend
- **Framework:** Express 4 + tRPC 11
- **Language:** TypeScript
- **Database:** MySQL (via Drizzle ORM)
- **Authentication:** Manus OAuth + JWT sessions
- **File Storage:** S3-compatible storage
- **OTP:** Resend (Email) + Twilio (SMS)

### Development Tools
- **Package Manager:** pnpm
- **Build Tool:** Vite
- **Testing:** Vitest
- **Database Migrations:** Drizzle Kit
- **Code Quality:** TypeScript strict mode

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:
- Node.js 22.x installed
- pnpm installed (`npm install -g pnpm`)
- Access to the project repository
- Database credentials (ask team lead)
- Environment variables (ask team lead)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd haderos-mvp

# Install dependencies
pnpm install
```

### Step 2: Setup Environment

Create a `.env` file in the project root (copy from team lead or use `.env.example`):

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Storage
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key

# OTP Services
RESEND_API_KEY=your-resend-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Step 3: Initialize Database

```bash
# Push database schema
pnpm db:push

# Seed test data (optional)
pnpm db:seed
```

### Step 4: Start Development Server

```bash
# Start dev server (runs both frontend and backend)
pnpm dev
```

The application will be available at `http://localhost:3000`

---

## 📂 Project Structure

Understanding the project structure is crucial for efficient development:

```
haderos-mvp/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # Utilities and tRPC client
│   │   ├── App.tsx           # Main app with routes
│   │   └── main.tsx          # Entry point
│   └── public/               # Static assets
│
├── server/                    # Backend Express + tRPC
│   ├── _core/                # Framework core (DO NOT EDIT)
│   ├── routers/              # tRPC routers (your APIs)
│   ├── db*.ts                # Database query functions
│   └── routers.ts            # Main router aggregator
│
├── drizzle/                   # Database schema and migrations
│   ├── schema.ts             # Main schema
│   ├── schema-hr.ts          # HR system schema
│   ├── schema-nowshoes.ts    # NOW SHOES schema
│   └── schema-monthly.ts     # Monthly accounts schema
│
├── docs/                      # Documentation (you are here!)
├── scripts/                   # Automation scripts
└── templates/                 # Document templates
```

### Key Files to Know

| File | Purpose |
|------|---------|
| `server/routers.ts` | Main API router - add your new routers here |
| `server/routers/hr.ts` | HR system APIs |
| `server/routers/nowshoes.ts` | NOW SHOES business APIs |
| `server/routers/shipments.ts` | Shipment tracking APIs |
| `server/db-hr.ts` | HR database functions |
| `server/db-nowshoes.ts` | NOW SHOES database functions |
| `client/src/App.tsx` | Frontend routes |
| `drizzle/schema*.ts` | Database table definitions |

---

## 🔄 Development Workflow

### 1. **Adding a New Feature**

Follow this workflow for any new feature:

#### Step 1: Update Database Schema

```typescript
// drizzle/schema.ts (or appropriate schema file)
export const myNewTable = mysqlTable('my_new_table', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: datetime('created_at').notNull(),
});
```

#### Step 2: Push Schema Changes

```bash
pnpm db:push
```

#### Step 3: Add Database Functions

```typescript
// server/db-myfeature.ts
import { getDb } from "./db";
import { myNewTable } from "../drizzle/schema";

export async function getMyData() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(myNewTable);
}

export async function createMyData(data: { name: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(myNewTable).values({
    name: data.name,
    createdAt: new Date(),
  });
}
```

#### Step 4: Create tRPC Router

```typescript
// server/routers/myfeature.ts
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getMyData, createMyData } from "../db-myfeature";

export const myFeatureRouter = router({
  list: publicProcedure.query(async () => {
    return await getMyData();
  }),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      return await createMyData(input);
    }),
});
```

#### Step 5: Register Router

```typescript
// server/routers.ts
import { myFeatureRouter } from "./routers/myfeature";

export const appRouter = router({
  // ... existing routers
  myFeature: myFeatureRouter,
});
```

#### Step 6: Create Frontend Page

```typescript
// client/src/pages/MyFeature.tsx
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function MyFeature() {
  const { data, isLoading } = trpc.myFeature.list.useQuery();
  const createMutation = trpc.myFeature.create.useMutation();
  
  const handleCreate = () => {
    createMutation.mutate({ name: "Test" });
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Feature</h1>
      <Button onClick={handleCreate}>Create</Button>
      {isLoading ? <p>Loading...</p> : (
        <ul>
          {data?.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

#### Step 7: Add Route

```typescript
// client/src/App.tsx
import MyFeature from "./pages/MyFeature";

function Router() {
  return (
    <Switch>
      {/* ... existing routes */}
      <Route path="/my-feature" component={MyFeature} />
    </Switch>
  );
}
```

### 2. **Testing Your Changes**

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/routers/myfeature.test.ts

# Run tests in watch mode
pnpm test --watch
```

### 3. **Committing Changes**

```bash
# Check what changed
git status

# Add files
git add .

# Commit with descriptive message
git commit -m "feat: add my feature with API and UI"

# Push to remote
git push origin your-branch-name
```

---

## 🎨 UI Development Guidelines

### Using shadcn/ui Components

The project uses shadcn/ui for consistent UI components. Always use these instead of creating custom components:

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Example usage
<Card>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>
    <Input placeholder="Enter text" />
    <Button>Submit</Button>
  </CardContent>
</Card>
```

### Arabic RTL Support

All pages must support Arabic RTL layout:

```typescript
// Always use dir="rtl" in parent containers
<div dir="rtl" className="p-6">
  <h1 className="text-right">عنوان الصفحة</h1>
</div>

// Use text-right for Arabic text
<p className="text-right">نص عربي</p>

// Use flex-row-reverse for RTL flex layouts
<div className="flex flex-row-reverse gap-4">
  <Button>زر 1</Button>
  <Button>زر 2</Button>
</div>
```

### Responsive Design

Always design mobile-first:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards will be 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

---

## 🔐 Authentication & Authorization

### Public vs Protected Routes

```typescript
// Public procedure (no authentication required)
publicProcedure.query(async () => {
  return { message: "Public data" };
});

// Protected procedure (requires login)
protectedProcedure.query(async ({ ctx }) => {
  // ctx.user is available here
  return { message: `Hello ${ctx.user.name}` };
});

// Admin-only procedure
protectedProcedure.query(async ({ ctx }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return { message: "Admin data" };
});
```

### Using Auth in Frontend

```typescript
import { useAuth } from "@/lib/trpc";

function MyComponent() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;
  
  return <div>Welcome {user.name}!</div>;
}
```

---

## 📊 Database Best Practices

### 1. **Always Use Drizzle ORM**

```typescript
// ✅ Good - Using Drizzle
const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));

// ❌ Bad - Raw SQL (avoid unless absolutely necessary)
const users = await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`);
```

### 2. **Handle Null Checks**

```typescript
const db = await getDb();
if (!db) {
  throw new Error("Database not available");
}

const result = await db.select().from(table);
if (!result || result.length === 0) {
  return null;
}

return result[0];
```

### 3. **Use Transactions for Multiple Operations**

```typescript
await db.transaction(async (tx) => {
  await tx.insert(orders).values(orderData);
  await tx.update(inventory).set({ quantity: newQuantity });
});
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Database not available"

**Solution:** Check your `DATABASE_URL` in `.env` and ensure the database server is running.

### Issue 2: "Module not found" errors

**Solution:** Run `pnpm install` to ensure all dependencies are installed.

### Issue 3: TypeScript errors after schema changes

**Solution:** Run `pnpm db:push` to sync the database, then restart the dev server.

### Issue 4: tRPC query not updating

**Solution:** Use `trpc.useUtils().myRouter.invalidate()` to force refetch:

```typescript
const utils = trpc.useUtils();
const mutation = trpc.myRouter.create.useMutation({
  onSuccess: () => {
    utils.myRouter.list.invalidate();
  },
});
```

---

## 📚 Learning Resources

### Internal Documentation
- [Architecture Overview](./02-architecture.md)
- [Database Guide](./03-database-guide.md)
- [API Guide](./04-api-guide.md)
- [Frontend Guide](./05-frontend-guide.md)
- [Testing Guide](./06-testing-guide.md)

### External Resources
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)

---

## 🤝 Getting Help

### Team Communication
- **Daily Standup:** 10:00 AM (share progress, blockers)
- **Code Reviews:** All PRs require review before merge
- **Questions:** Ask in team chat or schedule 1-on-1 with team lead

### Before Asking for Help
1. Check this documentation
2. Search existing issues/PRs
3. Try debugging with console.log
4. Check browser console for errors
5. Review error messages carefully

### When Asking for Help
Provide:
- What you're trying to do
- What you've tried
- Error messages (full stack trace)
- Relevant code snippets
- Screenshots if UI-related

---

## ✅ Onboarding Checklist

Complete these tasks in your first week:

- [ ] Setup development environment
- [ ] Run the application locally
- [ ] Read all documentation in `/docs/learning`
- [ ] Review main database schemas
- [ ] Explore the codebase structure
- [ ] Make a small test change (add a console.log)
- [ ] Create your first feature (guided by team lead)
- [ ] Write your first test
- [ ] Submit your first PR
- [ ] Attend daily standup
- [ ] Meet all team members

---

## 🎓 Next Steps

After completing onboarding:

1. Read [Architecture Overview](./02-architecture.md) to understand system design
2. Review [Database Guide](./03-database-guide.md) to learn the data model
3. Study [API Guide](./04-api-guide.md) to understand API patterns
4. Practice with [Frontend Guide](./05-frontend-guide.md) to build UIs
5. Master [Testing Guide](./06-testing-guide.md) to write quality tests

Welcome to the team! 🎉

---

**Last Updated:** December 18, 2025  
**Maintained by:** Development Team
