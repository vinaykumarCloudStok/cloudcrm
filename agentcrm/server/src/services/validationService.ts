import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

const BUSINESS_VALIDATION_DEFAULTS = JSON.stringify([
  { id: 1, question: 'What is the core business problem?', answer: '', completed: false, mandatory: true },
  { id: 2, question: 'What does success look like in 90 days?', answer: '', completed: false, mandatory: true },
  { id: 3, question: 'Who signs the contract?', answer: '', completed: false, mandatory: true },
  { id: 4, question: 'What is the budget range?', answer: '', completed: false, mandatory: true },
  { id: 5, question: 'What is the decision timeline?', answer: '', completed: false, mandatory: true },
  { id: 6, question: 'Other vendors being evaluated?', answer: '', completed: false, mandatory: true },
  { id: 7, question: 'Any known blockers?', answer: '', completed: false, mandatory: false },
]);

const TECHNICAL_VALIDATION_DEFAULTS = JSON.stringify([
  { id: 1, question: 'Existing infrastructure documented?', answer: '', completed: false, mandatory: true },
  { id: 2, question: 'Security/compliance requirements identified?', answer: '', completed: false, mandatory: true },
  { id: 3, question: 'Deliverability confirmed?', answer: '', confidence: '', completed: false, mandatory: true },
  { id: 4, question: 'Solution pattern match identified?', answer: '', completed: false, mandatory: true },
  { id: 5, question: 'Complexity rating?', answer: '', completed: false, mandatory: true },
  { id: 6, question: 'Technical risks documented?', answer: '', completed: false, mandatory: true },
  { id: 7, question: 'ROM effort estimate?', answer: '', completed: false, mandatory: true },
  { id: 8, question: 'Key delivery phases?', answer: '', completed: false, mandatory: false },
]);

export async function getChecklists(opportunityId: number) {
  try {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) {
      throw new AppError('Opportunity not found.', 404);
    }

    // Try to find existing checklists
    let businessChecklist = await prisma.validationChecklist.findUnique({
      where: {
        opportunityId_type: {
          opportunityId,
          type: 'BUSINESS',
        },
      },
    });

    let technicalChecklist = await prisma.validationChecklist.findUnique({
      where: {
        opportunityId_type: {
          opportunityId,
          type: 'TECHNICAL',
        },
      },
    });

    // Create with defaults if they don't exist
    if (!businessChecklist) {
      businessChecklist = await prisma.validationChecklist.create({
        data: {
          opportunityId,
          type: 'BUSINESS',
          items: BUSINESS_VALIDATION_DEFAULTS,
        },
      });
    }

    if (!technicalChecklist) {
      technicalChecklist = await prisma.validationChecklist.create({
        data: {
          opportunityId,
          type: 'TECHNICAL',
          items: TECHNICAL_VALIDATION_DEFAULTS,
        },
      });
    }

    return {
      business: businessChecklist,
      technical: technicalChecklist,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch checklists.', 500);
  }
}

export async function updateChecklist(
  opportunityId: number,
  type: string,
  items: string,
  userId: number
) {
  try {
    const existing = await prisma.validationChecklist.findUnique({
      where: {
        opportunityId_type: {
          opportunityId,
          type,
        },
      },
    });

    if (!existing) {
      throw new AppError('Checklist not found.', 404);
    }

    // Check if all mandatory items are completed
    const parsedItems = JSON.parse(items);
    const allMandatoryCompleted = parsedItems
      .filter((item: { mandatory: boolean }) => item.mandatory)
      .every((item: { completed: boolean }) => item.completed);

    const updateData: Record<string, unknown> = {
      items,
      completedById: userId,
    };

    if (allMandatoryCompleted) {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    const checklist = await prisma.validationChecklist.update({
      where: {
        opportunityId_type: {
          opportunityId,
          type,
        },
      },
      data: updateData,
    });

    return checklist;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update checklist.', 500);
  }
}

export async function getHandoff(opportunityId: number) {
  try {
    const handoff = await prisma.solutionHandoff.findUnique({
      where: { opportunityId },
    });

    return handoff;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch handoff.', 500);
  }
}

export async function createOrUpdateHandoff(
  opportunityId: number,
  data: {
    finalArchitecture?: string;
    keyDecisions?: string;
    technicalRisks?: string;
    assumptions?: string;
    deliveryTeamComposition?: string;
    phaseBreakdown?: string;
    status?: string;
  },
  userId: number
) {
  try {
    const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) {
      throw new AppError('Opportunity not found.', 404);
    }

    const handoff = await prisma.solutionHandoff.upsert({
      where: { opportunityId },
      create: {
        opportunityId,
        finalArchitecture: data.finalArchitecture || null,
        keyDecisions: data.keyDecisions || null,
        technicalRisks: data.technicalRisks || null,
        assumptions: data.assumptions || null,
        deliveryTeamComposition: data.deliveryTeamComposition || null,
        phaseBreakdown: data.phaseBreakdown || null,
        status: data.status || 'DRAFT',
        createdById: userId,
      },
      update: {
        finalArchitecture: data.finalArchitecture,
        keyDecisions: data.keyDecisions,
        technicalRisks: data.technicalRisks,
        assumptions: data.assumptions,
        deliveryTeamComposition: data.deliveryTeamComposition,
        phaseBreakdown: data.phaseBreakdown,
        status: data.status,
      },
    });

    return handoff;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create or update handoff.', 500);
  }
}
