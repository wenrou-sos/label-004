import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function extractToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookieToken = req.cookies.token;
  if (cookieToken) {
    return cookieToken;
  }
  return null;
}

export async function authenticate(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<JwtPayload | null> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: '未授权，请先登录' });
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token无效或已过期' });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, role: true },
  });

  if (!user) {
    res.status(401).json({ error: '用户不存在' });
    return null;
  }

  return payload;
}

export function requireRole(roles: string[], payload: JwtPayload, res: NextApiResponse): boolean {
  if (!roles.includes(payload.role)) {
    res.status(403).json({ error: '权限不足' });
    return false;
  }
  return true;
}
