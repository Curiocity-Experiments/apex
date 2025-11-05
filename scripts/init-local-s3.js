#!/usr/bin/env node

/**
 * Initialize Local S3 Bucket for Curiocity
 *
 * This script creates the S3 bucket in LocalStack
 * Run this after starting docker-compose
 *
 * Usage: node scripts/init-local-s3.js
 */

const { S3Client, CreateBucketCommand, ListBucketsCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

// LocalStack endpoint
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const region = process.env.AWS_DEFAULT_REGION || 'us-west-1';
const bucketName = process.env.S3_UPLOAD_BUCKET || 'curiocity-local-bucket';

const client = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
  forcePathStyle: true, // Required for LocalStack
});

async function listBuckets() {
  try {
    const command = new ListBucketsCommand({});
    const response = await client.send(command);
    return response.Buckets || [];
  } catch (error) {
    console.error('❌ Error listing buckets:', error.message);
    console.error('   Make sure LocalStack is running: docker-compose up -d');
    process.exit(1);
  }
}

async function createBucket() {
  try {
    const command = new CreateBucketCommand({
      Bucket: bucketName,
    });
    await client.send(command);
    console.log(`✅ Created bucket: ${bucketName}`);
  } catch (error) {
    if (error.name === 'BucketAlreadyOwnedByYou' || error.name === 'BucketAlreadyExists') {
      console.log(`⚠️  Bucket already exists: ${bucketName}`);
    } else {
      console.error(`❌ Error creating bucket:`, error.message);
      throw error;
    }
  }
}

async function configureCORS() {
  try {
    const corsConfig = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    };

    const command = new PutBucketCorsCommand(corsConfig);
    await client.send(command);
    console.log(`✅ Configured CORS for: ${bucketName}`);
  } catch (error) {
    console.error(`❌ Error configuring CORS:`, error.message);
    throw error;
  }
}

async function initializeS3() {
  console.log('🚀 Initializing Local S3 Bucket...\n');
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   Region: ${region}`);
  console.log(`   Bucket: ${bucketName}\n`);

  // Check existing buckets
  const existingBuckets = await listBuckets();
  console.log(`📋 Existing buckets: ${existingBuckets.length > 0 ? existingBuckets.map(b => b.Name).join(', ') : 'none'}\n`);

  // Create bucket
  await createBucket();

  // Configure CORS
  await configureCORS();

  console.log('\n✨ S3 initialization complete!');
}

// Run the script
initializeS3().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
