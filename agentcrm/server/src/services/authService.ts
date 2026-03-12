import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string = 'SALES_REP',
  managerId?: number
) {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('A user with this email already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        managerId: managerId || null,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to register user.', 500);
  }
}

export async function login(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Contact your administrator.', 403);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password.', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtSecret || !jwtRefreshSecret) {
      throw new AppError('Server configuration error: JWT secrets not set.', 500);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      managerId: user.managerId,
    };

    const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });
    const refreshToken = jwt.sign(tokenPayload, jwtRefreshSecret, { expiresIn: '7d' });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to login.', 500);
  }
}

export async function refreshToken(token: string) {
  try {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtRefreshSecret || !jwtSecret) {
      throw new AppError('Server configuration error: JWT secrets not set.', 500);
    }

    const decoded = jwt.verify(token, jwtRefreshSecret) as {
      userId: number;
      email: string;
      role: string;
      managerId: number | null;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated.', 403);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      managerId: user.managerId,
    };

    const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });

    return { accessToken };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token has expired.', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid refresh token.', 401);
    }
    throw new AppError('Failed to refresh token.', 500);
  }
}

export async function getProfile(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        manager: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to get profile.', 500);
  }
}
