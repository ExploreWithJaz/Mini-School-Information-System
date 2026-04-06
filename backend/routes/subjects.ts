import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Subjects } from '../types/subjects';
import { createSubject, getAllSubjects, getSubjectById, getSubjectsByCourseId, updateSubject, deleteSubject, InputSubjects } from '../service/subjectsService';
import { authenticate } from '../middleware/authMiddleware';

async function subjectsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all subjects - PROTECTED
  fastify.get('/subjects', 
    { onRequest: [authenticate] },
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      return getAllSubjects();
    }
  );

  // GET subject by ID - PROTECTED
  fastify.get('/subjects/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      return getSubjectById(id);
    }
  );

  // GET subjects by course ID - PROTECTED
  fastify.get('/courses/:courseID/subjects', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { courseID } = req.params as { courseID: string };
      return getSubjectsByCourseId(courseID);
    }
  );

  // POST create a new subject - PROTECTED
  fastify.post('/subjects', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      return createSubject(req.body as InputSubjects);
    }
  );

  // PATCH update subject - PROTECTED
  fastify.patch('/subjects/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      return updateSubject(id, req.body as Partial<InputSubjects>);
    }
  );

  // DELETE subject - PROTECTED
  fastify.delete('/subjects/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      return { deleted: await deleteSubject(id) };
    }
  );
}

export default subjectsRoutes;