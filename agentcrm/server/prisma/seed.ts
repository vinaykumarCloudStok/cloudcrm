import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const hash = await bcrypt.hash('password123', 12);

  // Users
  const admin = await prisma.user.create({
    data: { email: 'admin@agentcrm.com', passwordHash: hash, firstName: 'Admin', lastName: 'User', role: 'ADMIN' },
  });
  const mgr1 = await prisma.user.create({
    data: { email: 'sarah.manager@agentcrm.com', passwordHash: hash, firstName: 'Sarah', lastName: 'Chen', role: 'SALES_MANAGER' },
  });
  const mgr2 = await prisma.user.create({
    data: { email: 'mike.manager@agentcrm.com', passwordHash: hash, firstName: 'Mike', lastName: 'Johnson', role: 'SALES_MANAGER' },
  });
  const rep1 = await prisma.user.create({
    data: { email: 'alex.rep@agentcrm.com', passwordHash: hash, firstName: 'Alex', lastName: 'Kumar', role: 'SALES_REP', managerId: mgr1.id },
  });
  const rep2 = await prisma.user.create({
    data: { email: 'priya.rep@agentcrm.com', passwordHash: hash, firstName: 'Priya', lastName: 'Sharma', role: 'SALES_REP', managerId: mgr1.id },
  });
  const rep3 = await prisma.user.create({
    data: { email: 'james.rep@agentcrm.com', passwordHash: hash, firstName: 'James', lastName: 'Wilson', role: 'SALES_REP', managerId: mgr2.id },
  });
  const rep4 = await prisma.user.create({
    data: { email: 'lisa.rep@agentcrm.com', passwordHash: hash, firstName: 'Lisa', lastName: 'Park', role: 'SALES_REP', managerId: mgr2.id },
  });
  const mktg = await prisma.user.create({
    data: { email: 'emma.marketing@agentcrm.com', passwordHash: hash, firstName: 'Emma', lastName: 'Davis', role: 'MARKETING_MANAGER' },
  });
  const sa = await prisma.user.create({
    data: { email: 'raj.sa@agentcrm.com', passwordHash: hash, firstName: 'Raj', lastName: 'Patel', role: 'SOLUTION_ARCHITECT' },
  });

  // 10 Accounts with different statuses/industries
  const accounts = await Promise.all([
    prisma.account.create({
      data: {
        companyName: 'TechNova Solutions', website: 'https://technova.com', industry: 'IT Services',
        companySize: '51-200', country: 'India', ownerId: rep1.id, status: 'ACTIVE_LEAD',
        healthScore: 82, source: 'Manual', lastActivityAt: new Date(),
      },
    }),
    prisma.account.create({
      data: {
        companyName: 'CloudFirst Pty Ltd', website: 'https://cloudfirst.com.au', industry: 'SaaS',
        companySize: '201-500', country: 'Australia', ownerId: rep1.id, status: 'CLIENT',
        healthScore: 90, source: 'Referral', lastActivityAt: new Date(),
      },
    }),
    prisma.account.create({
      data: {
        companyName: 'Meridian Consulting', website: 'https://meridian.co.nz', industry: 'Professional Services',
        companySize: '11-50', country: 'New Zealand', ownerId: rep2.id, status: 'PROSPECT',
        healthScore: 55, source: 'Manual', lastActivityAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.account.create({
      data: {
        companyName: 'DataStream Inc', website: 'https://datastream.com', industry: 'SaaS',
        companySize: '500+', country: 'US', ownerId: rep2.id, status: 'ACTIVE_LEAD',
        healthScore: 72, source: 'Smart Prospect Engine',
      },
    }),
    prisma.account.create({
      data: {
        companyName: 'InfraScale Systems', website: 'https://infrascale.in', industry: 'IT Services',
        companySize: '201-500', country: 'India', ownerId: rep3.id, status: 'PROSPECT',
        healthScore: 40, source: 'Import', lastActivityAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.account.create({
      data: {
        companyName: 'NexGen Digital', website: 'https://nexgen.com', industry: 'IT Services',
        companySize: '51-200', country: 'India', ownerId: rep3.id, status: 'ACTIVE_LEAD',
        healthScore: 65, source: 'Manual',
      },
    }),
    prisma.account.create({
      data: {
        companyName: 'Pacific Enterprise', website: 'https://pacent.com.au', industry: 'Professional Services',
        companySize: '11-50', country: 'Australia', ownerId: rep4.id, status: 'CLIENT',
        healthScore: 85, source: 'Referral', lastActivityAt: new Date(),
      },
    }),
    prisma.account.create({
      data: {
        companyName: 'Zenith Corp', website: 'https://zenithcorp.com', industry: 'SaaS',
        companySize: '201-500', country: 'US', ownerId: rep4.id, status: 'CHURNED',
        healthScore: 20, source: 'Import',
      },
    }),
    prisma.account.create({
      data: {
        companyName: 'Quantum Labs', website: 'https://quantumlabs.in', industry: 'IT Services',
        companySize: '1-10', country: 'India', ownerId: rep1.id, status: 'PROSPECT',
        healthScore: 45, source: 'Manual',
      },
    }),
    prisma.account.create({
      data: {
        companyName: 'Apex Solutions', website: 'https://apex.co.nz', industry: 'Professional Services',
        companySize: '51-200', country: 'New Zealand', ownerId: rep2.id, status: 'ACTIVE_LEAD',
        healthScore: 70, source: 'Referral',
      },
    }),
  ]);

  // Tech tags
  await prisma.accountTechTag.createMany({
    data: [
      { accountId: accounts[0].id, tag: 'AWS' },
      { accountId: accounts[0].id, tag: 'React' },
      { accountId: accounts[0].id, tag: 'Node.js' },
      { accountId: accounts[1].id, tag: 'Azure' },
      { accountId: accounts[1].id, tag: 'Kubernetes' },
      { accountId: accounts[1].id, tag: 'Terraform' },
      { accountId: accounts[3].id, tag: 'GCP' },
      { accountId: accounts[3].id, tag: 'Python' },
      { accountId: accounts[3].id, tag: 'Snowflake' },
      { accountId: accounts[4].id, tag: 'AWS' },
      { accountId: accounts[4].id, tag: 'Docker' },
      { accountId: accounts[4].id, tag: 'Jenkins' },
      { accountId: accounts[5].id, tag: 'Azure' },
      { accountId: accounts[5].id, tag: 'Java' },
    ],
  });

  // 13 Contacts across accounts
  const contacts = await Promise.all([
    prisma.contact.create({ data: { firstName: 'Vikram', lastName: 'Mehta', accountId: accounts[0].id, jobTitle: 'CTO', roleType: 'DECISION_MAKER', email: 'vikram@technova.com', department: 'IT', lastContactedAt: new Date() } }),
    prisma.contact.create({ data: { firstName: 'Anita', lastName: 'Rao', accountId: accounts[0].id, jobTitle: 'VP Engineering', roleType: 'CHAMPION', email: 'anita@technova.com', department: 'IT' } }),
    prisma.contact.create({ data: { firstName: 'David', lastName: 'Lee', accountId: accounts[1].id, jobTitle: 'CEO', roleType: 'DECISION_MAKER', email: 'david@cloudfirst.com.au', department: 'C-Suite' } }),
    prisma.contact.create({ data: { firstName: 'Sophie', lastName: 'Taylor', accountId: accounts[1].id, jobTitle: 'Head of IT', roleType: 'CHAMPION', email: 'sophie@cloudfirst.com.au', department: 'IT', lastContactedAt: new Date() } }),
    prisma.contact.create({ data: { firstName: 'Tom', lastName: 'Brown', accountId: accounts[2].id, jobTitle: 'Managing Director', roleType: 'DECISION_MAKER', email: 'tom@meridian.co.nz', department: 'C-Suite' } }),
    prisma.contact.create({ data: { firstName: 'Rachel', lastName: 'Green', accountId: accounts[3].id, jobTitle: 'VP Product', roleType: 'INFLUENCER', email: 'rachel@datastream.com', department: 'Operations' } }),
    prisma.contact.create({ data: { firstName: 'Kevin', lastName: 'Singh', accountId: accounts[3].id, jobTitle: 'CTO', roleType: 'DECISION_MAKER', email: 'kevin@datastream.com', department: 'IT' } }),
    prisma.contact.create({ data: { firstName: 'Amit', lastName: 'Gupta', accountId: accounts[4].id, jobTitle: 'IT Director', roleType: 'CHAMPION', email: 'amit@infrascale.in', department: 'IT' } }),
    prisma.contact.create({ data: { firstName: 'Neha', lastName: 'Verma', accountId: accounts[5].id, jobTitle: 'CFO', roleType: 'BLOCKER', email: 'neha@nexgen.com', department: 'Finance' } }),
    prisma.contact.create({ data: { firstName: 'Mark', lastName: 'Anderson', accountId: accounts[6].id, jobTitle: 'CEO', roleType: 'DECISION_MAKER', email: 'mark@pacent.com.au', department: 'C-Suite', lastContactedAt: new Date() } }),
    prisma.contact.create({ data: { firstName: 'Jenny', lastName: 'Wu', accountId: accounts[7].id, jobTitle: 'CTO', roleType: 'DECISION_MAKER', email: 'jenny@zenithcorp.com', department: 'IT' } }),
    prisma.contact.create({ data: { firstName: 'Arjun', lastName: 'Nair', accountId: accounts[8].id, jobTitle: 'Founder', roleType: 'DECISION_MAKER', email: 'arjun@quantumlabs.in', department: 'C-Suite' } }),
    prisma.contact.create({ data: { firstName: 'Lucy', lastName: 'Harris', accountId: accounts[9].id, jobTitle: 'Operations Manager', roleType: 'INFLUENCER', email: 'lucy@apex.co.nz', department: 'Operations' } }),
  ]);

  // 10 Leads
  const leads = await Promise.all([
    prisma.lead.create({ data: { firstName: 'Vikram', lastName: 'Mehta', email: 'vikram@technova.com', accountId: accounts[0].id, stage: 'QUALIFIED', aiScore: 85, source: 'Manual', assignedRepId: rep1.id } }),
    prisma.lead.create({ data: { firstName: 'Tom', lastName: 'Brown', email: 'tom@meridian.co.nz', accountId: accounts[2].id, stage: 'ENGAGED', aiScore: 68, source: 'Referral', assignedRepId: rep2.id } }),
    prisma.lead.create({ data: { firstName: 'Rachel', lastName: 'Green', email: 'rachel@datastream.com', accountId: accounts[3].id, stage: 'CONTACTED', aiScore: 52, source: 'Import', assignedRepId: rep2.id } }),
    prisma.lead.create({ data: { firstName: 'Amit', lastName: 'Gupta', email: 'amit@infrascale.in', accountId: accounts[4].id, stage: 'NEW', aiScore: 35, source: 'Import', assignedRepId: rep3.id } }),
    prisma.lead.create({ data: { firstName: 'Neha', lastName: 'Verma', email: 'neha@nexgen.com', accountId: accounts[5].id, stage: 'ENGAGED', aiScore: 74, source: 'Manual', assignedRepId: rep3.id } }),
    prisma.lead.create({ data: { firstName: 'Arjun', lastName: 'Nair', email: 'arjun@quantumlabs.in', accountId: accounts[8].id, stage: 'NEW', aiScore: 40, source: 'Manual', assignedRepId: rep1.id } }),
    prisma.lead.create({ data: { firstName: 'Lucy', lastName: 'Harris', email: 'lucy@apex.co.nz', accountId: accounts[9].id, stage: 'CONTACTED', aiScore: 60, source: 'Referral', assignedRepId: rep2.id } }),
    prisma.lead.create({ data: { firstName: 'John', lastName: 'Smith', email: 'john.smith@newprospect.com', stage: 'NEW', aiScore: 25, source: 'Import', assignedRepId: rep4.id } }),
    prisma.lead.create({ data: { firstName: 'Maria', lastName: 'Garcia', email: 'maria@startup.io', stage: 'NURTURE', aiScore: 30, source: 'Smart Prospect Engine', assignedRepId: rep4.id } }),
    prisma.lead.create({ data: { firstName: 'Chris', lastName: 'Evans', email: 'chris@bigcorp.com', stage: 'DISQUALIFIED', aiScore: 10, source: 'Import', assignedRepId: rep1.id } }),
  ]);

  // 8 Opportunities
  const opps = await Promise.all([
    prisma.opportunity.create({
      data: {
        name: 'TechNova Cloud Migration', accountId: accounts[0].id, primaryContactId: contacts[0].id,
        dealValue: 250000, expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stage: 'PROPOSAL', probability: 45, description: 'Full AWS cloud migration for TechNova', ownerId: rep1.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        name: 'CloudFirst DevOps Transformation', accountId: accounts[1].id, primaryContactId: contacts[3].id,
        dealValue: 500000, expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        stage: 'NEGOTIATION', probability: 70, description: 'Enterprise DevOps pipeline setup', ownerId: rep1.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        name: 'Meridian Digital Transformation', accountId: accounts[2].id, primaryContactId: contacts[4].id,
        dealValue: 120000, expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        stage: 'DISCOVERY', probability: 10, description: 'Digital transformation consulting', ownerId: rep2.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        name: 'DataStream Analytics Platform', accountId: accounts[3].id, primaryContactId: contacts[6].id,
        dealValue: 350000, expectedCloseDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        stage: 'CONTRACT_SENT', probability: 90, description: 'Custom analytics platform build', ownerId: rep2.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        name: 'NexGen Security Audit', accountId: accounts[5].id,
        dealValue: 80000, expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        stage: 'DISCOVERY', probability: 10, ownerId: rep3.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        name: 'Pacific Enterprise ERP Integration', accountId: accounts[6].id, primaryContactId: contacts[9].id,
        dealValue: 180000, stage: 'CLOSED_WON', probability: 100, winReason: 'product_fit', ownerId: rep4.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        name: 'Zenith CRM Implementation', accountId: accounts[7].id, primaryContactId: contacts[10].id,
        dealValue: 150000, stage: 'CLOSED_LOST', probability: 0, lostReason: 'price', ownerId: rep4.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        name: 'Apex Cloud Strategy', accountId: accounts[9].id, primaryContactId: contacts[12].id,
        dealValue: 95000, expectedCloseDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        stage: 'BUSINESS_VALIDATION', probability: 20, ownerId: rep2.id,
      },
    }),
  ]);

  // Activities
  await prisma.activity.createMany({
    data: [
      { type: 'CALL', description: 'Discovery call with CTO - discussed cloud migration needs', userId: rep1.id, accountId: accounts[0].id, contactId: contacts[0].id, opportunityId: opps[0].id },
      { type: 'EMAIL', description: 'Sent proposal document for cloud migration project', userId: rep1.id, accountId: accounts[0].id, opportunityId: opps[0].id },
      { type: 'MEETING', description: 'Technical deep-dive with engineering team', userId: rep1.id, accountId: accounts[1].id, opportunityId: opps[1].id },
      { type: 'CALL', description: 'Initial outreach - left voicemail', userId: rep2.id, accountId: accounts[2].id, contactId: contacts[4].id },
      { type: 'NOTE', description: 'Client mentioned budget review in Q2', userId: rep2.id, accountId: accounts[3].id, opportunityId: opps[3].id },
      { type: 'EMAIL', description: 'Contract sent for signature via DocuSign', userId: rep2.id, accountId: accounts[3].id, opportunityId: opps[3].id },
      { type: 'CALL', description: 'Follow-up call - positive response, scheduling demo', userId: rep3.id, accountId: accounts[5].id },
      { type: 'MEETING', description: 'Quarterly business review', userId: rep4.id, accountId: accounts[6].id, contactId: contacts[9].id },
    ],
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      { title: 'Follow up on TechNova proposal', assignedToId: rep1.id, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), priority: 'HIGH', status: 'PENDING', relatedEntityType: 'opportunity', relatedEntityId: opps[0].id },
      { title: 'Send case study to CloudFirst', assignedToId: rep1.id, dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), priority: 'MEDIUM', status: 'PENDING', relatedEntityType: 'opportunity', relatedEntityId: opps[1].id },
      { title: 'Schedule discovery call with Meridian', assignedToId: rep2.id, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), priority: 'HIGH', status: 'PENDING', relatedEntityType: 'opportunity', relatedEntityId: opps[2].id },
      { title: 'Check DocuSign status for DataStream', assignedToId: rep2.id, dueDate: new Date(), priority: 'URGENT', status: 'IN_PROGRESS', relatedEntityType: 'opportunity', relatedEntityId: opps[3].id },
      { title: 'Prepare security audit proposal for NexGen', assignedToId: rep3.id, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), priority: 'MEDIUM', status: 'PENDING' },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: rep1.id, title: 'Hot Lead Alert', message: 'Vikram Mehta scored 85 - engage now!', type: 'HOT_LEAD', link: '/leads/1' },
      { userId: rep2.id, title: 'Deal At Risk', message: 'DataStream Analytics Platform - contract unsigned for 5 days', type: 'DEAL_RISK', link: '/opportunities/4' },
      { userId: rep1.id, title: 'Task Overdue', message: 'Follow up on TechNova proposal is overdue', type: 'TASK_DUE', link: '/tasks' },
    ],
  });

  // Signals
  await prisma.accountSignal.createMany({
    data: [
      { accountId: accounts[0].id, signalType: 'HIRING_SURGE', title: 'Hiring Surge Detected', summary: 'TechNova posted 8 new IT roles in the last 2 weeks - expansion likely', severity: 'HIGH' },
      { accountId: accounts[3].id, signalType: 'FUNDING', title: 'Series B Funding', summary: 'DataStream raised $25M Series B - budget likely available', severity: 'HIGH' },
      { accountId: accounts[4].id, signalType: 'DORMANT_ALERT', title: 'Account Dormant', summary: 'No activity in 100+ days - re-engagement needed', severity: 'HIGH' },
      { accountId: accounts[1].id, signalType: 'TECH_STACK_CHANGE', title: 'New Tool Detected', summary: 'CloudFirst appears to be evaluating Kubernetes - upsell opportunity', severity: 'MEDIUM' },
    ],
  });

  // Campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Q1 Cloud Migration Outreach',
      description: 'Outreach campaign targeting IT Services companies interested in cloud migration',
      createdById: mktg.id,
      status: 'ACTIVE',
      steps: {
        create: [
          { stepOrder: 1, subject: 'Is {{company}} ready for the cloud?', bodyTemplate: 'Hi {{firstName}},\n\nI noticed {{company}} is growing rapidly...', delayDays: 0 },
          { stepOrder: 2, subject: 'Quick question about your infrastructure', bodyTemplate: 'Hi {{firstName}},\n\nI wanted to follow up on my previous email...', delayDays: 3 },
          { stepOrder: 3, subject: 'Case study: How companies like {{company}} saved 40%', bodyTemplate: 'Hi {{firstName}},\n\nI thought you might find this relevant...', delayDays: 5 },
        ],
      },
    },
  });

  // Assignment rule
  await prisma.assignmentRule.create({
    data: {
      type: 'ROUND_ROBIN',
      config: JSON.stringify({ reps: [rep1.id, rep2.id, rep3.id, rep4.id] }),
      isActive: true,
    },
  });

  // Agent configs
  await prisma.agentConfig.createMany({
    data: [
      { agentType: 'LEAD_SCORING', config: JSON.stringify({ hotThreshold: 75, coldThreshold: 30, decayDays: 14, decayPoints: 5 }) },
      { agentType: 'ACCOUNT_INTEL', config: JSON.stringify({ enabledSignals: ['HIRING_SURGE', 'FUNDING', 'LEADERSHIP_CHANGE', 'NEWS', 'TECH_STACK_CHANGE', 'DORMANT_ALERT'], sensitivity: 'BALANCED', dormantDays: 90 }) },
      { agentType: 'DEAL_COACH', config: JSON.stringify({ autoGenerate: true, briefSections: 6 }) },
      { agentType: 'FOLLOW_UP', config: JSON.stringify({ noReplyDays: 3, noContactDays: 21, overdueEscalationDays: 3 }) },
    ],
  });

  console.log('Seed completed successfully!');
  console.log('Login credentials:');
  console.log('  Admin: admin@agentcrm.com / password123');
  console.log('  Sales Manager: sarah.manager@agentcrm.com / password123');
  console.log('  Sales Rep: alex.rep@agentcrm.com / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
