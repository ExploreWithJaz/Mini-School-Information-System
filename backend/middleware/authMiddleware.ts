import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../service/authService';

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return reply.code(401).send({
        message: 'Invalid or expired token'
      });
    }

    // Attach userId to request for use in route handlers
    (req as any).userId = decoded.userId;
  } catch (error: any) {
    return reply.code(401).send({
      message: 'Authentication failed'
    });
  }
}