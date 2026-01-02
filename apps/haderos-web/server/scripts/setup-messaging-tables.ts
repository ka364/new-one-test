/**
 * 📨 Setup Messaging System Database Tables
 *
 * Creates all 12 tables for the unified messaging system
 */

import { getDb } from '../db';
import { sql } from 'drizzle-orm';

async function setupMessagingTables() {
  const db = await getDb();

  try {
    console.log('🔍 Checking messaging tables...\n');

    // Check if tables exist
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'conversations',
        'conversation_participants',
        'messages',
        'message_attachments',
        'message_reactions',
        'message_read_receipts',
        'typing_indicators',
        'push_notification_tokens',
        'notification_history',
        'ai_usage_tracking',
        'subscription_plans',
        'user_subscriptions'
      )
    `);

    console.log(`✅ Found ${result.rows.length} existing tables\n`);

    if (result.rows.length === 12) {
      console.log('✅ All messaging tables already exist!');
      return;
    }

    console.log('📝 Creating missing messaging tables...\n');

    // 1. conversations
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(36) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,

        organization_id INTEGER REFERENCES users(id),
        department_id VARCHAR(100),

        ticket_number VARCHAR(50) UNIQUE,
        ticket_status VARCHAR(50),
        ticket_priority VARCHAR(20),
        ticket_category VARCHAR(100),
        assigned_to_id INTEGER REFERENCES users(id),

        ai_model VARCHAR(50),
        ai_persona VARCHAR(100),

        title VARCHAR(255),
        description TEXT,

        is_archived BOOLEAN DEFAULT FALSE,
        is_pinned BOOLEAN DEFAULT FALSE,
        is_locked BOOLEAN DEFAULT FALSE,

        metadata JSONB DEFAULT '{}',

        created_by_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        closed_at TIMESTAMP
      )
    `);
    console.log('✅ Created: conversations');

    // Create indexes for conversations
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS conversations_type_idx ON conversations(type);
      CREATE INDEX IF NOT EXISTS conversations_org_idx ON conversations(organization_id);
      CREATE INDEX IF NOT EXISTS conversations_status_idx ON conversations(ticket_status);
      CREATE INDEX IF NOT EXISTS conversations_assigned_idx ON conversations(assigned_to_id);
      CREATE INDEX IF NOT EXISTS conversations_created_by_idx ON conversations(created_by_id);
    `);

    // 2. conversation_participants
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id SERIAL PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        role VARCHAR(50) DEFAULT 'member',

        is_muted BOOLEAN DEFAULT FALSE,
        muted_until TIMESTAMP,

        last_read_at TIMESTAMP,
        last_read_message_id VARCHAR(36),

        joined_at TIMESTAMP DEFAULT NOW(),
        left_at TIMESTAMP,

        UNIQUE(conversation_id, user_id)
      )
    `);
    console.log('✅ Created: conversation_participants');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS participants_conversation_idx ON conversation_participants(conversation_id);
      CREATE INDEX IF NOT EXISTS participants_user_idx ON conversation_participants(user_id);
    `);

    // 3. messages
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id),

        content TEXT NOT NULL,
        content_type VARCHAR(50) DEFAULT 'text',

        is_ai_generated BOOLEAN DEFAULT FALSE,
        ai_model VARCHAR(50),
        ai_tokens INTEGER,
        ai_cost INTEGER,

        parent_message_id VARCHAR(36) REFERENCES messages(id),
        thread_count INTEGER DEFAULT 0,

        is_edited BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_at TIMESTAMP,

        metadata JSONB DEFAULT '{}',

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created: messages');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS messages_parent_idx ON messages(parent_message_id);
      CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
    `);

    // 4. message_attachments
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS message_attachments (
        id VARCHAR(36) PRIMARY KEY,
        message_id VARCHAR(36) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,

        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        file_size INTEGER NOT NULL,
        file_url VARCHAR(500) NOT NULL,

        thumbnail_url VARCHAR(500),

        width INTEGER,
        height INTEGER,

        uploaded_by_id INTEGER NOT NULL REFERENCES users(id),
        uploaded_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created: message_attachments');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS attachments_message_idx ON message_attachments(message_id);
    `);

    // 5. message_reactions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(36) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        emoji VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),

        UNIQUE(message_id, user_id, emoji)
      )
    `);
    console.log('✅ Created: message_reactions');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS reactions_message_idx ON message_reactions(message_id);
      CREATE INDEX IF NOT EXISTS reactions_user_idx ON message_reactions(user_id);
    `);

    // 6. message_read_receipts
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS message_read_receipts (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(36) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP DEFAULT NOW(),

        UNIQUE(message_id, user_id)
      )
    `);
    console.log('✅ Created: message_read_receipts');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS read_receipts_message_idx ON message_read_receipts(message_id);
      CREATE INDEX IF NOT EXISTS read_receipts_user_idx ON message_read_receipts(user_id);
    `);

    // 7. typing_indicators
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS typing_indicators (
        id SERIAL PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        started_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      )
    `);
    console.log('✅ Created: typing_indicators');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS typing_conversation_idx ON typing_indicators(conversation_id);
      CREATE INDEX IF NOT EXISTS typing_expires_idx ON typing_indicators(expires_at);
    `);

    // 8. push_notification_tokens
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_notification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        platform VARCHAR(20) NOT NULL,
        device_id VARCHAR(100),
        device_name VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        last_used_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created: push_notification_tokens');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON push_notification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS push_tokens_active_idx ON push_notification_tokens(is_active);
    `);

    // 9. notification_history
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notification_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        conversation_id VARCHAR(36) REFERENCES conversations(id),
        message_id VARCHAR(36) REFERENCES messages(id),
        fcm_message_id VARCHAR(255),
        fcm_response JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        action_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created: notification_history');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS notifications_user_idx ON notification_history(user_id);
      CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notification_history(is_read);
      CREATE INDEX IF NOT EXISTS notifications_conversation_idx ON notification_history(conversation_id);
    `);

    // 10. ai_usage_tracking
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_usage_tracking (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id INTEGER REFERENCES users(id),
        subscription_tier VARCHAR(50) NOT NULL,
        messages_this_month INTEGER DEFAULT 0,
        tokens_this_month INTEGER DEFAULT 0,
        cost_this_month INTEGER DEFAULT 0,
        monthly_message_limit INTEGER NOT NULL,
        monthly_token_limit INTEGER NOT NULL,
        monthly_budget INTEGER NOT NULL,
        period_start_date TIMESTAMP NOT NULL,
        period_end_date TIMESTAMP NOT NULL,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created: ai_usage_tracking');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS ai_usage_user_idx ON ai_usage_tracking(user_id);
      CREATE INDEX IF NOT EXISTS ai_usage_org_idx ON ai_usage_tracking(organization_id);
      CREATE INDEX IF NOT EXISTS ai_usage_tier_idx ON ai_usage_tracking(subscription_tier);
    `);

    // 11. subscription_plans
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        tier VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        ai_messages_per_month INTEGER NOT NULL,
        ai_tokens_per_month INTEGER NOT NULL,
        ai_monthly_budget INTEGER NOT NULL,
        available_models JSONB DEFAULT '[]',
        features JSONB DEFAULT '{}',
        monthly_price INTEGER NOT NULL,
        yearly_price INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created: subscription_plans');

    // 12. user_subscriptions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id INTEGER REFERENCES users(id),
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        status VARCHAR(50) NOT NULL,
        billing_cycle VARCHAR(20) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        cancelled_at TIMESTAMP,
        amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'EGP',
        payment_method VARCHAR(50),
        last_payment_date TIMESTAMP,
        next_payment_date TIMESTAMP,
        auto_renew BOOLEAN DEFAULT TRUE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created: user_subscriptions');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS subscriptions_user_idx ON user_subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS subscriptions_org_idx ON user_subscriptions(organization_id);
      CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON user_subscriptions(status);
      CREATE INDEX IF NOT EXISTS subscriptions_end_date_idx ON user_subscriptions(end_date);
    `);

    console.log('\n✅ All messaging tables created successfully!\n');

    // Verify tables
    const verifyResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'conversations',
        'conversation_participants',
        'messages',
        'message_attachments',
        'message_reactions',
        'message_read_receipts',
        'typing_indicators',
        'push_notification_tokens',
        'notification_history',
        'ai_usage_tracking',
        'subscription_plans',
        'user_subscriptions'
      )
      ORDER BY table_name
    `);

    console.log(`✅ Verification: ${verifyResult.rows.length}/12 tables exist\n`);

    verifyResult.rows.forEach((row: any) => {
      console.log(`   ✓ ${row.table_name}`);
    });
  } catch (error) {
    console.error('❌ Error setting up messaging tables:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMessagingTables()
    .then(() => {
      console.log('\n✅ Setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupMessagingTables };
