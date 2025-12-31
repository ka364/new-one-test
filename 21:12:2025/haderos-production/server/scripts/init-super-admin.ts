// Initialize Mohamed Al-Wakeel as Super Admin
// Run this script once to create the Super Admin account

import { db } from "../db";
import { developers, developerPermissions, developerAuditLogs } from "../../drizzle/schema-developer";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";

const SUPER_ADMIN_EMAIL = "mohamed.alwakeel@haderos.ai";
const SUPER_ADMIN_NAME = "Mohamed Al-Wakeel";

async function initSuperAdmin() {
  console.log("🚀 Initializing Super Admin...\n");
  
  try {
    // Check if Super Admin already exists
    const existing = await db.query.developers.findFirst({
      where: eq(developers.email, SUPER_ADMIN_EMAIL),
    });
    
    if (existing) {
      console.log("✅ Super Admin already exists!");
      console.log(`   Email: ${existing.email}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Tier: ${existing.tier}`);
      console.log(`   Created: ${existing.createdAt}`);
      return;
    }
    
    // Generate secure API key
    const apiKey = `hdr_${crypto.randomBytes(32).toString("hex")}`;
    const apiKeyHash = await bcrypt.hash(apiKey, 10);
    
    // Create Super Admin developer account
    const [superAdmin] = await db.insert(developers).values({
      userId: crypto.randomUUID(), // In production, link to actual user account
      email: SUPER_ADMIN_EMAIL,
      name: SUPER_ADMIN_NAME,
      tier: "tier0_super_admin",
      accessLevel: "full_access",
      isActive: true,
      isVerified: true,
      apiKey,
      apiKeyHash,
      bio: "Super Administrator - Full system access",
      skills: ["System Administration", "DevOps", "Full Stack Development"],
      specializations: ["System Management", "Developer Operations", "Security"],
    }).returning();
    
    // Create Super Admin permissions (full access)
    await db.insert(developerPermissions).values({
      developerId: superAdmin.id,
      canRead: true,
      canWrite: true,
      canDeploy: true,
      canReview: true,
      canManageUsers: true,
      canManageSettings: true,
      environments: ["production", "staging", "development", "sandbox"],
      allowedRepositories: ["*"], // All repositories
      allowedBranches: ["*"], // All branches
      allowedPaths: ["*"], // All paths
    });
    
    // Log the creation
    await db.insert(developerAuditLogs).values({
      developerId: superAdmin.id,
      action: "super_admin_initialized",
      resource: "system",
      resourceId: superAdmin.id,
      details: {
        email: SUPER_ADMIN_EMAIL,
        name: SUPER_ADMIN_NAME,
        tier: "tier0_super_admin",
      },
      success: true,
    });
    
    console.log("✅ Super Admin created successfully!\n");
    console.log("=" * 60);
    console.log("📋 SUPER ADMIN DETAILS");
    console.log("=" * 60);
    console.log(`Name:       ${superAdmin.name}`);
    console.log(`Email:      ${superAdmin.email}`);
    console.log(`Tier:       ${superAdmin.tier}`);
    console.log(`Access:     ${superAdmin.accessLevel}`);
    console.log(`ID:         ${superAdmin.id}`);
    console.log(`User ID:    ${superAdmin.userId}`);
    console.log(`Created:    ${superAdmin.createdAt}`);
    console.log("\n🔑 API KEY (SAVE THIS - IT WON'T BE SHOWN AGAIN):");
    console.log(`   ${apiKey}`);
    console.log("\n⚠️  IMPORTANT:");
    console.log("   - Save the API key in a secure location");
    console.log("   - This key provides full system access");
    console.log("   - Never share this key with anyone");
    console.log("   - Use environment variables to store it");
    console.log("\n📖 NEXT STEPS:");
    console.log("   1. Save the API key securely");
    console.log("   2. Login to the system with the email above");
    console.log("   3. Access Super Admin dashboard at /super-admin");
    console.log("   4. Start managing developers and companies");
    console.log("=" * 60);
    
  } catch (error) {
    console.error("❌ Error initializing Super Admin:", error);
    throw error;
  }
}

// Run the script
initSuperAdmin()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
