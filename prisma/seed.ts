import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.documentTag.deleteMany();
  await prisma.reportTag.deleteMany();
  await prisma.document.deleteMany();
  await prisma.report.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Cleaned existing data\n');

  // Create dev admin user (for local development)
  console.log('👤 Creating users...');
  const devUser = await prisma.user.create({
    data: {
      email: 'dev@local.apex',
      name: 'Dev User',
      provider: 'dev',
    },
  });
  console.log(`✓ Created ${devUser.name} (${devUser.email}) [DEV ADMIN]`);

  const user1 = await prisma.user.create({
    data: {
      email: 'sarah.analyst@example.com',
      name: 'Sarah Chen',
      provider: 'google',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'john.research@example.com',
      name: 'John Martinez',
      provider: 'email',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
    },
  });

  console.log(`✓ Created ${user1.name} (${user1.email})`);
  console.log(`✓ Created ${user2.name} (${user2.email})\n`);

  // Create sample reports for user1
  console.log('📊 Creating reports...');
  const report1 = await prisma.report.create({
    data: {
      userId: user1.id,
      name: 'Q4 2024 Tech Industry Analysis',
      content: `# Q4 2024 Tech Industry Analysis

## Executive Summary
This report analyzes the tech industry performance in Q4 2024, focusing on major players including Apple, Microsoft, and Google.

## Key Findings
- Cloud computing revenue up 35% YoY
- AI investments reaching record levels
- Cybersecurity concerns driving new regulations

## Market Trends
Lorem ipsum dolor sit amet, consectetur adipiscing elit...`,
    },
  });

  const report2 = await prisma.report.create({
    data: {
      userId: user1.id,
      name: 'Healthcare Sector Deep Dive',
      content: `# Healthcare Sector Analysis

## Overview
Comprehensive analysis of healthcare sector trends and investment opportunities.

## Biotech Innovations
Recent breakthroughs in gene therapy and personalized medicine...`,
    },
  });

  const report3 = await prisma.report.create({
    data: {
      userId: user2.id,
      name: 'Renewable Energy Investment Thesis',
      content: `# Renewable Energy Investment Thesis

## Market Overview
Analysis of solar, wind, and battery storage opportunities...`,
    },
  });

  console.log(`✓ Created report: ${report1.name}`);
  console.log(`✓ Created report: ${report2.name}`);
  console.log(`✓ Created report: ${report3.name}\n`);

  // Add tags to reports
  console.log('🏷️  Adding report tags...');
  await prisma.reportTag.createMany({
    data: [
      { reportId: report1.id, tag: 'technology' },
      { reportId: report1.id, tag: 'quarterly' },
      { reportId: report1.id, tag: 'market-analysis' },
      { reportId: report2.id, tag: 'healthcare' },
      { reportId: report2.id, tag: 'biotech' },
      { reportId: report3.id, tag: 'renewable-energy' },
      { reportId: report3.id, tag: 'esg' },
    ],
  });
  console.log('✓ Added report tags\n');

  // Create sample documents
  console.log('📄 Creating documents...');

  // Helper function to create a file hash
  const createFileHash = (content: string) => {
    return crypto.createHash('sha256').update(content).digest('hex');
  };

  const doc1Content = 'Apple Q4 2024 Earnings Report - Revenue: $119.6B, EPS: $2.18';
  const doc1 = await prisma.document.create({
    data: {
      reportId: report1.id,
      filename: 'apple_q4_earnings.txt',
      fileHash: createFileHash(doc1Content),
      storagePath: './storage/documents/apple_q4_earnings.txt',
      parsedContent: doc1Content,
      notes: 'Key financial metrics from Apple Q4 earnings call',
    },
  });

  const doc2Content = 'Microsoft Cloud Revenue Analysis - Azure revenue up 30% YoY';
  const doc2 = await prisma.document.create({
    data: {
      reportId: report1.id,
      filename: 'microsoft_cloud_analysis.pdf',
      fileHash: createFileHash(doc2Content),
      storagePath: './storage/documents/microsoft_cloud_analysis.pdf',
      parsedContent: doc2Content,
      notes: 'Detailed breakdown of Microsoft cloud performance',
    },
  });

  const doc3Content = 'FDA Approval for Novel Gene Therapy Treatment';
  const doc3 = await prisma.document.create({
    data: {
      reportId: report2.id,
      filename: 'fda_approval_gene_therapy.pdf',
      fileHash: createFileHash(doc3Content),
      storagePath: './storage/documents/fda_approval_gene_therapy.pdf',
      parsedContent: doc3Content,
      notes: 'Breakthrough therapy designation granted',
    },
  });

  const doc4Content = 'Solar Panel Efficiency Improvements - New technology reaches 25% efficiency';
  const doc4 = await prisma.document.create({
    data: {
      reportId: report3.id,
      filename: 'solar_efficiency_report.txt',
      fileHash: createFileHash(doc4Content),
      storagePath: './storage/documents/solar_efficiency_report.txt',
      parsedContent: doc4Content,
      notes: 'Latest developments in solar panel technology',
    },
  });

  console.log(`✓ Created document: ${doc1.filename}`);
  console.log(`✓ Created document: ${doc2.filename}`);
  console.log(`✓ Created document: ${doc3.filename}`);
  console.log(`✓ Created document: ${doc4.filename}\n`);

  // Add tags to documents
  console.log('🏷️  Adding document tags...');
  await prisma.documentTag.createMany({
    data: [
      { documentId: doc1.id, tag: 'earnings' },
      { documentId: doc1.id, tag: 'apple' },
      { documentId: doc1.id, tag: 'financial-data' },
      { documentId: doc2.id, tag: 'microsoft' },
      { documentId: doc2.id, tag: 'cloud-computing' },
      { documentId: doc2.id, tag: 'azure' },
      { documentId: doc3.id, tag: 'fda' },
      { documentId: doc3.id, tag: 'biotech' },
      { documentId: doc3.id, tag: 'gene-therapy' },
      { documentId: doc4.id, tag: 'solar' },
      { documentId: doc4.id, tag: 'renewable-energy' },
      { documentId: doc4.id, tag: 'efficiency' },
    ],
  });
  console.log('✓ Added document tags\n');

  // Summary
  console.log('📈 Seed Summary:');
  const userCount = await prisma.user.count();
  const reportCount = await prisma.report.count();
  const documentCount = await prisma.document.count();

  console.log(`   Users: ${userCount}`);
  console.log(`   Reports: ${reportCount}`);
  console.log(`   Documents: ${documentCount}`);
  console.log('\n✅ Database seeded successfully!\n');

  console.log('🔐 Development Login:');
  console.log(`   Email: ${devUser.email}`);
  console.log('   (No password needed in development mode)\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
