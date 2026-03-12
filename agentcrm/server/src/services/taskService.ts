import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

interface TaskFilters {
  status?: string;
  priority?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  page: number;
  limit: number;
}

export async function getTasks(userId: number, filters: TaskFilters) {
  try {
    const where: Record<string, unknown> = {
      assignedToId: userId,
    };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.dueDateFrom || filters.dueDateTo) {
      const dueDateFilter: Record<string, Date> = {};
      if (filters.dueDateFrom) dueDateFilter.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo) dueDateFilter.lte = new Date(filters.dueDateTo);
      where.dueDate = dueDateFilter;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch tasks.', 500);
  }
}

export async function createTask(
  data: {
    title: string;
    description?: string;
    assignedToId: number;
    dueDate?: string;
    priority?: string;
    status?: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
  },
  userId: number
) {
  try {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        assignedToId: data.assignedToId || userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'PENDING',
        relatedEntityType: data.relatedEntityType || null,
        relatedEntityId: data.relatedEntityId || null,
      },
    });

    return task;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create task.', 500);
  }
}

export async function updateTask(id: number, data: Record<string, unknown>) {
  try {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Task not found.', 404);
    }

    // Handle dueDate conversion
    if (data.dueDate && typeof data.dueDate === 'string') {
      data.dueDate = new Date(data.dueDate as string);
    }

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    return task;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update task.', 500);
  }
}
