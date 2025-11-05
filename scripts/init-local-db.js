#!/usr/bin/env node

/**
 * Initialize Local DynamoDB Tables for Curiocity
 *
 * This script creates all required DynamoDB tables in LocalStack
 * Run this after starting docker-compose
 *
 * Usage: node scripts/init-local-db.js
 */

const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

// LocalStack endpoint
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const region = process.env.AWS_DEFAULT_REGION || 'us-west-1';

const client = new DynamoDBClient({
  endpoint,
  region,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

// Table definitions
const tables = [
  {
    TableName: 'curiocity-users',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'curiocity-local-login-users',
    KeySchema: [
      { AttributeName: 'email', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'email', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'curiocity-documents',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'curiocity-resources',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
  {
    TableName: 'curiocity-resourcemeta',
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  },
];

async function listExistingTables() {
  try {
    const command = new ListTablesCommand({});
    const response = await client.send(command);
    return response.TableNames || [];
  } catch (error) {
    console.error('❌ Error listing tables:', error.message);
    console.error('   Make sure LocalStack is running: docker-compose up -d');
    process.exit(1);
  }
}

async function createTable(tableConfig) {
  try {
    const command = new CreateTableCommand(tableConfig);
    await client.send(command);
    console.log(`✅ Created table: ${tableConfig.TableName}`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`⚠️  Table already exists: ${tableConfig.TableName}`);
    } else {
      console.error(`❌ Error creating table ${tableConfig.TableName}:`, error.message);
      throw error;
    }
  }
}

async function initializeTables() {
  console.log('🚀 Initializing Local DynamoDB Tables...\n');
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Region: ${region}\n`);

  // Check existing tables
  const existingTables = await listExistingTables();
  console.log(`📋 Existing tables: ${existingTables.length > 0 ? existingTables.join(', ') : 'none'}\n`);

  // Create tables
  for (const tableConfig of tables) {
    await createTable(tableConfig);
  }

  console.log('\n✨ Initialization complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Copy .env.local.example to .env.local');
  console.log('   2. Run: npm install');
  console.log('   3. Run: npm run dev');
}

// Run the script
initializeTables().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
