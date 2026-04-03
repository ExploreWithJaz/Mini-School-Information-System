import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { Subjects } from '../types/subjects';
import { createSubject, getAllSubjects, getSubjectById, getSubjectsByCourseId, updateSubject, deleteSubject, InputSubjects } from '../service/subjectsService';

async function subjectsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all subjects
  fastify.get('/subjects', async (_req: FastifyRequest, _reply: FastifyReply) => {
    return getAllSubjects();
  });

  // GET subject by ID
  fastify.get('/subjects/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return getSubjectById(id);
  });

  // GET subjects by course ID
  fastify.get('/courses/:courseID/subjects', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { courseID } = req.params as { courseID: string };
    return getSubjectsByCourseId(courseID);
  });

  // POST create a new subject
  fastify.post('/subjects', async (req: FastifyRequest, _reply: FastifyReply) => {
    return createSubject(req.body as InputSubjects);
  });

  // PUT update subject
  fastify.patch('/subjects/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return updateSubject(id, req.body as Partial<InputSubjects>);
  });

  // DELETE subject
  fastify.delete('/subjects/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return { deleted: await deleteSubject(id) };
  });
}

export default subjectsRoutes;