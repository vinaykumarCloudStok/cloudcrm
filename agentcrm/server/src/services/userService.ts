import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return users.map((user) => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch users.', 500);
  }
}

export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
  managerId?: number;
}) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'SALES_REP',
        managerId: data.managerId || null,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create user.', 500);
  }
}

export async function updateUser(id: number, data: Record<string, unknown>) {
  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('User not found.', 404);
    }

    // Remove passwordHash from data to prevent direct updates
    const { passwordHash, password, ...safeData } = data as Record<string, unknown>;

    const user = await prisma.user.update({
      where: { id },
      data: safeData,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update user.', 500);
  }
}

export async function getReps() {
  try {
    const reps = await prisma.user.findMany({
      where: { role: 'SALES_REP', isActive: true },
    });

    return reps.map((user) => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch sales reps.', 500);
  }
}

export async function getSolutionArchitects() {
  try {
    const architects = await prisma.user.findMany({
      where: { role: 'SOLUTION_ARCHITECT', isActive: true },
    });

    return architects.map((user) => {
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to fetch solution architects.', 500);
  }
}
