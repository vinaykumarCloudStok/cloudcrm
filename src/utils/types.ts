export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  managerId?: number;
  isActive: boolean;
  createdAt: string;
}

export interface Account {
  id: number;
  companyName: string;
  website?: string;
  industry?: string;
  companySize?: string;
  country?: string;
  ownerId: number;
  status: string;
  annualRevenue?: number;
  healthScore: number;
  lastActivityAt?: string;
  source?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  techTags?: { id: number; tag: string }[];
  _count?: { contacts: number; leads: number; opportunities: number };
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  accountId: number;
  jobTitle?: string;
  roleType: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  department?: string;
  communicationStyle?: string;
  lastContactedAt?: string;
  doNotContact: boolean;
  createdAt: string;
  account?: Account;
}

export interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  accountId?: number;
  stage: string;
  aiScore: number;
  source?: string;
  assignedRepId?: number;
  convertedOpportunityId?: number;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  assignedRep?: User;
  scoreLogs?: LeadScoreLog[];
  dealCoachBriefs?: DealCoachBrief[];
}

export interface Opportunity {
  id: number;
  name: string;
  accountId: number;
  primaryContactId?: number;
  dealValue: number;
  expectedCloseDate?: string;
  stage: string;
  probability: number;
  description?: string;
  ownerId: number;
  solutionArchitectId?: number;
  winReason?: string;
  lostReason?: string;
  proposalValueAtSubmit?: number;
  createdAt: string;
  updatedAt: string;
  account?: Account;
  primaryContact?: Contact;
  owner?: User;
  validationChecklists?: ValidationChecklist[];
}

export interface AccountSignal {
  id: number;
  accountId: number;
  signalType: string;
  title: string;
  summary: string;
  severity: string;
  isActioned: boolean;
  createdAt: string;
}

export interface LeadScoreLog {
  id: number;
  leadId: number;
  previousScore: number;
  newScore: number;
  reason: string;
  createdAt: string;
}

export interface DealCoachBrief {
  id: number;
  opportunityId?: number;
  leadId?: number;
  briefType: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  assignedToId: number;
  dueDate?: string;
  priority: string;
  status: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdAt: string;
  assignedTo?: User;
}

export interface Activity {
  id: number;
  type: string;
  description: string;
  userId: number;
  accountId?: number;
  contactId?: number;
  leadId?: number;
  opportunityId?: number;
  metadata?: string;
  createdAt: string;
  user?: User;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Campaign {
  id: number;
  name: string;
  description?: string;
  createdById: number;
  status: string;
  targetSegment?: string;
  createdAt: string;
  steps?: CampaignStep[];
  enrollments?: CampaignEnrollment[];
  _count?: { steps: number; enrollments: number };
}

export interface CampaignStep {
  id: number;
  campaignId: number;
  stepOrder: number;
  subject: string;
  bodyTemplate: string;
  delayDays: number;
}

export interface CampaignEnrollment {
  id: number;
  campaignId: number;
  contactId: number;
  currentStep: number;
  status: string;
  enrolledAt: string;
  contact?: Contact;
}

export interface ValidationChecklist {
  id: number;
  opportunityId: number;
  type: string;
  items: string;
  completedAt?: string;
  completedById?: number;
}

export interface SolutionHandoff {
  id: number;
  opportunityId: number;
  finalArchitecture?: string;
  keyDecisions?: string;
  technicalRisks?: string;
  assumptions?: string;
  deliveryTeamComposition?: string;
  phaseBreakdown?: string;
  status: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  totalValue: number;
  opportunities?: Opportunity[];
}

export interface DashboardData {
  pipelineValue: PipelineStage[];
  leadsNeedingAttention: number;
  dealsAtRisk: Opportunity[];
  upcomingTasks: Task[];
  priorities: { type: string; title: string; link: string; urgency: string }[];
  agentFeed: Activity[];
}
