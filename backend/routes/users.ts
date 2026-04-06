import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Users } from '../types/users';
import { createUser, getAllUsers, getUserById, getUserByEmail, updateUser, deleteUser, InputUsers, UpdateUsers } from '../service/usersService';
import { authenticate } from '../middleware/authMiddleware';

async function usersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all users - PROTECTED
  fastify.get('/users', 
    { onRequest: [authenticate] },
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      return getAllUsers();
    }
  );

  // GET user by ID - PROTECTED
  fastify.get('/users/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      return getUserById(id);
    }
  );

  // GET user by email - PROTECTED
  fastify.get('/users/email/:email', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { email } = req.params as { email: string };
      return getUserByEmail(email);
    }
  );

  // POST create a new user - PROTECTED
  fastify.post('/users', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      return createUser(req.body as InputUsers);
    }
  );

  // PUT update user - PROTECTED
  fastify.patch('/users/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      return updateUser(id, req.body as UpdateUsers);
    }
  );

  // DELETE user - PROTECTED
  fastify.delete('/users/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      return { deleted: await deleteUser(id) };
    }
  );
}

export default usersRoutes;