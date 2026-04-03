import pool from '../db/connection';
import { Users } from '../types/users';
import bcrypt from 'bcrypt';

export interface InputUsers {
  email: string;
  password: string;
  role: string;
}

export interface UpdateUsers {
  email?: string;
  password?: string;
  role?: string;
}

// CREATE - Add a new user
export async function createUser(data: InputUsers): Promise<Users> {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const query = `
    INSERT INTO users (email, password_hash, role, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING id, email, password_hash as "passwordHash", role, created_at as "createdDate", updated_at as "updatedDate"
  `;
  const result = await (pool as any).query(query, [
    data.email,
    hashedPassword,
    data.role
  ]);
  return result.rows[0];
}

// READ - Get all users
export async function getAllUsers(): Promise<Users[]> {
  const query = `
    SELECT id, email, password_hash as "passwordHash", role, created_at as "createdDate", updated_at as "updatedDate"
    FROM users
    ORDER BY created_at DESC
  `;
  const result = await (pool as any).query(query);
  return result.rows;
}

// READ - Get user by ID
export async function getUserById(id: string): Promise<Users | null> {
  const query = `
    SELECT id, email, password_hash as "passwordHash", role, created_at as "createdDate", updated_at as "updatedDate"
    FROM users
    WHERE id = $1
  `;
  const result = await (pool as any).query(query, [id]);
  return result.rows[0] || null;
}

// READ - Get user by email
export async function getUserByEmail(email: string): Promise<Users | null> {
  const query = `
    SELECT id, email, password_hash as "passwordHash", role, created_at as "createdDate", updated_at as "updatedDate"
    FROM users
    WHERE email = $1
  `;
  const result = await (pool as any).query(query, [email]);
  return result.rows[0] || null;
}

// UPDATE - Update a user
export async function updateUser(id: string, data: UpdateUsers): Promise<Users | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (data.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(data.email);
  }
  if (data.password !== undefined) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    fields.push(`password_hash = $${paramCount++}`);
    values.push(hashedPassword);
  }
  if (data.role !== undefined) {
    fields.push(`role = $${paramCount++}`);
    values.push(data.role);
  }

  if (fields.length === 0) return getUserById(id);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING id, email, password_hash as "passwordHash", role, created_at as "createdDate", updated_at as "updatedDate"
  `;

  const result = await (pool as any).query(query, values);
  return result.rows[0] || null;
}

// DELETE - Delete a user
export async function deleteUser(id: string): Promise<boolean> {
  const query = 'DELETE FROM users WHERE id = $1';
  const result = await (pool as any).query(query, [id]);
  return result.rowCount > 0;
}