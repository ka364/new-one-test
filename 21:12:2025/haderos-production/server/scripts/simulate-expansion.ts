/**
 * 7×7×7 Expansion Simulation Script
 * 
 * Simulates the complete expansion process:
 * - Phase 1: Initialize 7 entities for each stakeholder type
 * - Phase 2: Expand to 49 entities (7×7)
 * - Phase 3: Expand to 343 entities (7×7×7)
 * 
 * Generates realistic data for:
 * - Factories
 * - Merchants
 * - Marketers
 * - Developers
 * - Employees
 * - Customers
 */

import { db } from '../db';
import { 
  scalingHierarchy,
  factories,
  merchants,
  marketers,
  developers,
  employees,
  customers,
  scalingMetrics,
  expansionPlans,
} from '../../drizzle/schema-7x7-scaling';
import { nanoid } from 'nanoid';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateHierarchyCode(
  stakeholderType: string,
  level: number,
  position: number,
  parentCode?: string
): string {
  const typePrefix = stakeholderType.charAt(0).toUpperCase();
  
  if (level === 1) {
    return `${typePrefix}-1-${position}`;
  } else if (parentCode) {
    return `${parentCode}-${position}`;
  }
  
  return `${typePrefix}-${level}-${position}`;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals: number = 2): string {
  const value = Math.random() * (max - min) + min;
  return value.toFixed(decimals);
}

// ============================================================================
// TIER 1: INITIALIZE 7 ENTITIES
// ============================================================================

async function initializeTier1(stakeholderType: string) {
  console.log(`\n🚀 Initializing Tier 1 for ${stakeholderType}...`);
  
  const hierarchies = [];
  
  for (let i = 1; i <= 7; i++) {
    const code = generateHierarchyCode(stakeholderType, 1, i);
    const id = nanoid();
    
    hierarchies.push({
      id,
      stakeholderType: stakeholderType as any,
      tier: 'tier1_initial' as const,
      parentId: null,
      level: 1,
      position: i,
      code,
      name: `${stakeholderType.charAt(0).toUpperCase() + stakeholderType.slice(1)} ${i}`,
      isActive: true,
      activatedAt: new Date(),
      metadata: {},
    });
  }
  
  await db.insert(scalingHierarchy).values(hierarchies);
  console.log(`✅ Created ${hierarchies.length} tier 1 entities for ${stakeholderType}`);
  
  return hierarchies;
}

// ============================================================================
// TIER 2: EXPAND TO 49 (7×7)
// ============================================================================

async function expandToTier2(parentHierarchyId: string, parentCode: string, stakeholderType: string) {
  const children = [];
  
  for (let i = 1; i <= 7; i++) {
    const code = `${parentCode}-${i}`;
    const id = nanoid();
    
    children.push({
      id,
      stakeholderType: stakeholderType as any,
      tier: 'tier2_expansion' as const,
      parentId: parentHierarchyId,
      level: 2,
      position: i,
      code,
      name: `${stakeholderType.charAt(0).toUpperCase() + stakeholderType.slice(1)} ${code}`,
      isActive: true,
      activatedAt: new Date(),
      metadata: {},
    });
  }
  
  await db.insert(scalingHierarchy).values(children);
  return children;
}

async function expandAllToTier2(stakeholderType: string, tier1Entities: any[]) {
  console.log(`\n📈 Expanding to Tier 2 for ${stakeholderType}...`);
  
  let totalChildren = 0;
  for (const entity of tier1Entities) {
    const children = await expandToTier2(entity.id, entity.code, stakeholderType);
    totalChildren += children.length;
  }
  
  console.log(`✅ Expanded ${tier1Entities.length} tier 1 entities to ${totalChildren} tier 2 entities`);
  return totalChildren;
}

// ============================================================================
// TIER 3: EXPAND TO 343 (7×7×7)
// ============================================================================

async function expandToTier3(parentHierarchyId: string, parentCode: string, stakeholderType: string) {
  const children = [];
  
  for (let i = 1; i <= 7; i++) {
    const code = `${parentCode}-${i}`;
    const id = nanoid();
    
    children.push({
      id,
      stakeholderType: stakeholderType as any,
      tier: 'tier3_mega' as const,
      parentId: parentHierarchyId,
      level: 3,
      position: i,
      code,
      name: `${stakeholderType.charAt(0).toUpperCase() + stakeholderType.slice(1)} ${code}`,
      isActive: true,
      activatedAt: new Date(),
      metadata: {},
    });
  }
  
  await db.insert(scalingHierarchy).values(children);
  return children;
}

async function expandAllToTier3(stakeholderType: string) {
  console.log(`\n🚀 Expanding to Tier 3 for ${stakeholderType}...`);
  
  // Get all tier 2 entities
  const tier2Entities = await db.query.scalingHierarchy.findMany({
    where: (scalingHierarchy, { eq, and }) => and(
      eq(scalingHierarchy.stakeholderType, stakeholderType as any),
      eq(scalingHierarchy.tier, 'tier2_expansion')
    ),
  });
  
  let totalChildren = 0;
  for (const entity of tier2Entities) {
    const children = await expandToTier3(entity.id, entity.code, stakeholderType);
    totalChildren += children.length;
  }
  
  console.log(`✅ Expanded ${tier2Entities.length} tier 2 entities to ${totalChildren} tier 3 entities`);
  return totalChildren;
}

// ============================================================================
// GENERATE REALISTIC DATA
// ============================================================================

async function generateFactoryData(hierarchyId: string, code: string) {
  const countries = ['مصر', 'السعودية', 'الإمارات', 'الأردن', 'المغرب', 'تونس'];
  const cities = ['القاهرة', 'الرياض', 'دبي', 'عمان', 'الدار البيضاء', 'تونس'];
  
  const factory = {
    id: nanoid(),
    hierarchyId,
    name: `مصنع ${code}`,
    code,
    status: ['operational', 'construction', 'planning'][randomBetween(0, 2)] as any,
    country: countries[randomBetween(0, countries.length - 1)],
    city: cities[randomBetween(0, cities.length - 1)],
    address: `شارع ${randomBetween(1, 100)}، المنطقة الصناعية`,
    coordinates: { lat: randomDecimal(20, 35), lng: randomDecimal(30, 55) },
    monthlyCapacity: randomBetween(5000, 50000),
    currentProduction: randomBetween(1000, 40000),
    utilizationRate: randomDecimal(60, 95),
    investmentAmount: randomDecimal(1000000, 10000000),
    operatingCost: randomDecimal(100000, 500000),
    revenue: randomDecimal(200000, 1000000),
    totalEmployees: randomBetween(50, 500),
    plannedStartDate: new Date('2024-01-01'),
    actualStartDate: new Date('2024-06-01'),
    metadata: {},
  };
  
  await db.insert(factories).values(factory);
}

async function generateMerchantData(hierarchyId: string, code: string) {
  const countries = ['مصر', 'السعودية', 'الإمارات', 'الأردن', 'المغرب'];
  const cities = ['القاهرة', 'الرياض', 'دبي', 'عمان', 'الدار البيضاء'];
  
  const merchant = {
    id: nanoid(),
    hierarchyId,
    name: `تاجر ${code}`,
    code,
    type: ['wholesaler', 'retailer', 'distributor', 'online_seller', 'franchise'][randomBetween(0, 4)] as any,
    businessName: `شركة ${code} التجارية`,
    taxId: `TAX-${randomBetween(100000, 999999)}`,
    licenseNumber: `LIC-${randomBetween(10000, 99999)}`,
    country: countries[randomBetween(0, countries.length - 1)],
    city: cities[randomBetween(0, cities.length - 1)],
    address: `شارع ${randomBetween(1, 100)}`,
    monthlyOrderTarget: randomBetween(100, 1000),
    actualMonthlyOrders: randomBetween(50, 900),
    totalRevenue: randomDecimal(50000, 500000),
    commissionRate: randomDecimal(5, 15),
    isActive: true,
    verifiedAt: new Date(),
    metadata: {},
  };
  
  await db.insert(merchants).values(merchant);
}

async function generateMarketerData(hierarchyId: string, code: string) {
  const marketer = {
    id: nanoid(),
    hierarchyId,
    name: `مسوق ${code}`,
    code,
    type: ['digital_marketer', 'influencer', 'affiliate', 'agency', 'brand_ambassador'][randomBetween(0, 4)] as any,
    email: `marketer${code}@example.com`,
    phone: `+20${randomBetween(1000000000, 1999999999)}`,
    campaignsManaged: randomBetween(5, 50),
    totalSpend: randomDecimal(10000, 100000),
    totalRevenue: randomDecimal(20000, 200000),
    roi: randomDecimal(50, 300),
    commissionRate: randomDecimal(10, 20),
    totalCommission: randomDecimal(5000, 50000),
    socialMedia: {
      facebook: `@marketer${code}`,
      instagram: `@marketer${code}`,
      twitter: `@marketer${code}`,
    },
    followers: randomBetween(1000, 100000),
    isActive: true,
    verifiedAt: new Date(),
    metadata: {},
  };
  
  await db.insert(marketers).values(marketer);
}

async function generateDeveloperData(hierarchyId: string, code: string) {
  const developer = {
    id: nanoid(),
    hierarchyId,
    name: `مطور ${code}`,
    code,
    email: `dev${code}@example.com`,
    phone: `+20${randomBetween(1000000000, 1999999999)}`,
    level: ['junior', 'mid', 'senior', 'lead', 'architect'][randomBetween(0, 4)] as any,
    specialization: ['Frontend', 'Backend', 'Fullstack', 'Mobile', 'DevOps'][randomBetween(0, 4)],
    skills: ['React', 'Node.js', 'TypeScript', 'Python', 'Docker'],
    experienceYears: randomBetween(1, 15),
    projectsCompleted: randomBetween(5, 100),
    codeQualityScore: randomDecimal(70, 98),
    productivityScore: randomDecimal(75, 95),
    bugFixRate: randomDecimal(85, 99),
    monthlySalary: randomDecimal(5000, 30000),
    bonusEarned: randomDecimal(1000, 10000),
    githubUsername: `dev${code}`,
    githubStats: {
      commits: randomBetween(100, 5000),
      prs: randomBetween(10, 500),
      issues: randomBetween(5, 200),
    },
    isActive: true,
    hiredAt: new Date('2024-01-01'),
    metadata: {},
  };
  
  await db.insert(developers).values(developer);
}

async function generateEmployeeData(hierarchyId: string, code: string) {
  const employee = {
    id: nanoid(),
    hierarchyId,
    name: `موظف ${code}`,
    code,
    email: `emp${code}@example.com`,
    phone: `+20${randomBetween(1000000000, 1999999999)}`,
    nationalId: `${randomBetween(10000000000000, 39999999999999)}`,
    department: ['production', 'sales', 'marketing', 'hr', 'finance', 'logistics', 'customer_service'][randomBetween(0, 6)] as any,
    position: ['Manager', 'Supervisor', 'Specialist', 'Coordinator', 'Assistant'][randomBetween(0, 4)],
    employmentType: ['full_time', 'part_time', 'contract'][randomBetween(0, 2)],
    assignedFactoryId: null,
    workLocation: ['Cairo', 'Alexandria', 'Giza'][randomBetween(0, 2)],
    performanceScore: randomDecimal(70, 98),
    attendanceRate: randomDecimal(85, 99),
    tasksCompleted: randomBetween(10, 200),
    monthlySalary: randomDecimal(3000, 15000),
    bonuses: randomDecimal(500, 5000),
    deductions: randomDecimal(0, 1000),
    hiredAt: new Date('2024-01-01'),
    contractEndDate: new Date('2025-12-31'),
    isActive: true,
    metadata: {},
  };
  
  await db.insert(employees).values(employee);
}

async function generateCustomerData(hierarchyId: string, code: string) {
  const customer = {
    id: nanoid(),
    hierarchyId,
    name: `عميل ${code}`,
    code,
    email: `customer${code}@example.com`,
    phone: `+20${randomBetween(1000000000, 1999999999)}`,
    tier: ['bronze', 'silver', 'gold', 'platinum', 'vip'][randomBetween(0, 4)] as any,
    segment: ['retail', 'wholesale', 'corporate'][randomBetween(0, 2)],
    country: 'مصر',
    city: ['القاهرة', 'الإسكندرية', 'الجيزة'][randomBetween(0, 2)],
    address: `شارع ${randomBetween(1, 100)}`,
    totalOrders: randomBetween(1, 100),
    totalSpent: randomDecimal(1000, 100000),
    averageOrderValue: randomDecimal(500, 5000),
    lastOrderDate: new Date(),
    orderFrequency: randomBetween(7, 90),
    lifetimeValue: randomDecimal(2000, 200000),
    satisfactionScore: randomDecimal(70, 98),
    npsScore: randomBetween(-100, 100),
    loyaltyPoints: randomBetween(0, 10000),
    referralsCount: randomBetween(0, 50),
    isActive: true,
    registeredAt: new Date('2024-01-01'),
    metadata: {},
  };
  
  await db.insert(customers).values(customer);
}

// ============================================================================
// MAIN SIMULATION
// ============================================================================

async function runSimulation() {
  console.log('\n🎯 Starting 7×7×7 Expansion Simulation\n');
  console.log('=' .repeat(60));
  
  const stakeholderTypes = ['factory', 'merchant', 'marketer', 'developer', 'employee', 'customer'];
  
  // Phase 1: Initialize Tier 1 (7 entities each)
  console.log('\n📊 PHASE 1: Initializing Tier 1 (7 entities per type)');
  console.log('=' .repeat(60));
  
  const tier1Results: Record<string, any[]> = {};
  
  for (const type of stakeholderTypes) {
    tier1Results[type] = await initializeTier1(type);
  }
  
  // Phase 2: Expand to Tier 2 (49 entities each)
  console.log('\n📊 PHASE 2: Expanding to Tier 2 (7×7 = 49 entities per type)');
  console.log('=' .repeat(60));
  
  for (const type of stakeholderTypes) {
    await expandAllToTier2(type, tier1Results[type]);
  }
  
  // Phase 3: Expand to Tier 3 (343 entities each)
  console.log('\n📊 PHASE 3: Expanding to Tier 3 (7×7×7 = 343 entities per type)');
  console.log('=' .repeat(60));
  
  for (const type of stakeholderTypes) {
    await expandAllToTier3(type);
  }
  
  // Generate realistic data for all entities
  console.log('\n📊 PHASE 4: Generating realistic data for all entities');
  console.log('=' .repeat(60));
  
  const allHierarchies = await db.query.scalingHierarchy.findMany();
  
  for (const hierarchy of allHierarchies) {
    switch (hierarchy.stakeholderType) {
      case 'factory':
        await generateFactoryData(hierarchy.id, hierarchy.code);
        break;
      case 'merchant':
        await generateMerchantData(hierarchy.id, hierarchy.code);
        break;
      case 'marketer':
        await generateMarketerData(hierarchy.id, hierarchy.code);
        break;
      case 'developer':
        await generateDeveloperData(hierarchy.id, hierarchy.code);
        break;
      case 'employee':
        await generateEmployeeData(hierarchy.id, hierarchy.code);
        break;
      case 'customer':
        await generateCustomerData(hierarchy.id, hierarchy.code);
        break;
    }
  }
  
  console.log(`✅ Generated data for ${allHierarchies.length} entities`);
  
  // Summary
  console.log('\n📊 SIMULATION SUMMARY');
  console.log('=' .repeat(60));
  
  for (const type of stakeholderTypes) {
    const count = allHierarchies.filter(h => h.stakeholderType === type).length;
    console.log(`${type.padEnd(15)}: ${count} entities`);
  }
  
  console.log('\n✅ Simulation completed successfully!');
  console.log('=' .repeat(60));
}

// Run simulation
runSimulation()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Simulation failed:', error);
    process.exit(1);
  });
