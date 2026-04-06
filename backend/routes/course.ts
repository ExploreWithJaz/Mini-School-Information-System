import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import pool from '../db/connection';
import { Course } from '../types/course';
import { authenticate } from '../middleware/authMiddleware';

async function courseRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all courses - PROTECTED
  fastify.get('/courses', 
    { onRequest: [authenticate] },
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      const result = await (pool as { query: (sql: string) => Promise<{ rows: unknown[] }> }).query(
        'SELECT * FROM courses ORDER BY created_at DESC'
      );
      return result.rows;
    }
  );

  // GET a course by ID - PROTECTED
  fastify.get('/courses/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const result = await (pool as { query: (sql: string, params: unknown[]) => Promise<{ rows: unknown[] }> }).query(
        'SELECT * FROM courses WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    }
  );

  // POST create a new course - PROTECTED
  fastify.post('/courses', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { code, name, description } = req.body as { code: string; name: string; description?: string };
      const result = await (pool as { query: (sql: string, params: unknown[]) => Promise<{ rows: unknown[] }> }).query(
        'INSERT INTO courses (code, name, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
        [code, name, description]
      );
      return result.rows[0];
    }
  );

  // PATCH update a course - PROTECTED
  fastify.patch('/courses/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { code, name, description } = req.body as { code?: string; name?: string; description?: string };
      
      const fields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (code !== undefined) {
        fields.push(`code = $${paramCount++}`);
        values.push(code);
      }
      if (name !== undefined) {
        fields.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (description !== undefined) {
        fields.push(`description = $${paramCount++}`);
        values.push(description);
      }

      if (fields.length === 0) {
        return { message: 'No fields to update' };
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await (pool as { query: (sql: string, params: unknown[]) => Promise<{ rows: unknown[] }> }).query(
        `UPDATE courses SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      return result.rows[0] || null;
    }
  );

  // DELETE a course - PROTECTED
  fastify.delete('/courses/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const result = await (pool as { query: (sql: string, params: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }> }).query(
        'DELETE FROM courses WHERE id = $1',
        [id]
      );
      return { deleted: result.rowCount > 0 };
    }
  );
}

export default courseRoutes;