import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { SubjectPrerequisites } from '../types/subject_prerequisites';
import { createPrerequisite, getAllPrerequisites, getPrerequisiteById, getPrerequisitesBySubjectId, deletePrerequisite, InputSubjectPrerequisites } from '../service/subjectPrerequisitesService';
import { authenticate } from '../middleware/authMiddleware';

async function subjectPrerequisitesRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all prerequisites - PROTECTED
  fastify.get('/subject-prerequisites', 
    { onRequest: [authenticate] },
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      return getAllPrerequisites();
    }
  );

  // GET prerequisites by subject ID - PROTECTED
  fastify.get('/subjects/:subjectID/prerequisites', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { subjectID } = req.params as { subjectID: string };
      return getPrerequisitesBySubjectId(subjectID);
    }
  );

  // POST create a new prerequisite - PROTECTED
  fastify.post('/subjects/:subjectID/prerequisites', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { subjectID } = req.params as { subjectID: string };
      const { prerequisiteSubjectID } = req.body as { prerequisiteSubjectID: string };
      return createPrerequisite({
        subjectID,
        prerequisiteSubjectID
      });
    }
  );

  // DELETE prerequisite - PROTECTED
  fastify.delete('/subjects/:subjectID/prerequisites/:prerequisiteSubjectId', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { subjectID, prerequisiteSubjectId } = req.params as { subjectID: string; prerequisiteSubjectId: string };
      
      const prerequisites = await getPrerequisitesBySubjectId(subjectID);
      const prerequisite = prerequisites.find(p => p.prerequisiteSubjectID === prerequisiteSubjectId);
      
      if (!prerequisite) {
        return { deleted: false, message: 'Prerequisite not found' };
      }
      
      return { deleted: await deletePrerequisite(prerequisite.id) };
    }
  );
}

export default subjectPrerequisitesRoutes;