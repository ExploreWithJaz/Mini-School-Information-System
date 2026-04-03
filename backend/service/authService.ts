import pool from '../db/connection';
import { Users } from '../types/users';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '7d';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<Users, 'passwordHash'>;
  token: string;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<Users | null> {
  const query = `
    SELECT id, email, password_hash as "passwordHash", role, created_at as "createdDate", updated_at as "updatedDate"
    FROM users
    WHERE email = $1
  `;
  const result = await (pool as any).query(query, [email]);
  return result.rows[0] || null;
}

// Get user by ID
export async function getUserById(id: string): Promise<Users | null> {
  const query = `
    SELECT id, email, password_hash as "passwordHash", role, created_at as "createdDate", updated_at as "updatedDate"
    FROM users
    WHERE id = $1
  `;
  const result = await (pool as any).query(query, [id]);
  return result.rows[0] || null;
}

// Verify password
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}

// Login - validate credentials and return token
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const user = await getUserByEmail(data.email);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await verifyPassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user.id);
  const { passwordHash, ...userWithoutPassword } = user;
  
  return {
    user: userWithoutPassword,
    token
  };
}