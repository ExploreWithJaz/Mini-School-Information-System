import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { login, verifyToken, getUserById } from '../service/authService';

async function authRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // POST /auth/login
  fastify.post<{ Body: { email: string; password: string } }>(
    '/auth/login',
    async (
      req: FastifyRequest<{ Body: { email: string; password: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return reply.code(400).send({
            message: 'Email and password are required'
          });
        }

        const result = await login({ email, password });
        
        return reply.code(200).send({
          message: 'Login successful',
          ...result
        });
      } catch (error: any) {
        return reply.code(401).send({
          message: error.message || 'Login failed'
        });
      }
    }
  );

  // POST /auth/logout
  fastify.post('/auth/logout', async (req: FastifyRequest, reply: FastifyReply) => {
    // JWT is stateless, so logout just instructs client to remove token
    // Optional: You could blacklist tokens in a database if needed
    return reply.code(200).send({
      message: 'Logged out successfully'
    });
  });

  // GET /auth/me
  fastify.get('/auth/me', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // Extract token from Authorization header
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

      const user = await getUserById(decoded.userId);
      
      if (!user) {
        return reply.code(404).send({
          message: 'User not found'
        });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return reply.code(200).send({
        message: 'Current user',
        user: userWithoutPassword
      });
    } catch (error: any) {
      return reply.code(500).send({
        message: 'Error retrieving user information'
      });
    }
  });
}

export default authRoutes;