import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Users } from '../types/users';
import { createUser, getAllUsers, getUserById, getUserByEmail, updateUser, deleteUser, InputUsers, UpdateUsers } from '../service/usersService';

async function usersRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all users
  fastify.get('/users', async (_req: FastifyRequest, _reply: FastifyReply) => {
    return getAllUsers();
  });

  // GET user by ID
  fastify.get('/users/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return getUserById(id);
  });

  // GET user by email
  fastify.get('/users/email/:email', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { email } = req.params as { email: string };
    return getUserByEmail(email);
  });

  // POST create a new user
  fastify.post('/users', async (req: FastifyRequest, _reply: FastifyReply) => {
    return createUser(req.body as InputUsers);
  });

  // PUT update user
  fastify.patch('/users/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return updateUser(id, req.body as UpdateUsers);
  });

  // DELETE user
  fastify.delete('/users/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return { deleted: await deleteUser(id) };
  });
}

export default usersRoutes;