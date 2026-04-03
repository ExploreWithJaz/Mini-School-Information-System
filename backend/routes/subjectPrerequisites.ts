import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { SubjectPrerequisites } from '../types/subject_prerequisites';
import { createPrerequisite, getAllPrerequisites, getPrerequisiteById, getPrerequisitesBySubjectId, deletePrerequisite, InputSubjectPrerequisites } from '../service/subjectPrerequisitesService';

async function subjectPrerequisitesRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all prerequisites (optional, for admin)
  fastify.get('/subject-prerequisites', async (_req: FastifyRequest, _reply: FastifyReply) => {
    return getAllPrerequisites();
  });

  // GET prerequisites by subject ID
  fastify.get('/subjects/:subjectID/prerequisites', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { subjectID } = req.params as { subjectID: string };
    return getPrerequisitesBySubjectId(subjectID);
  });

  // POST create a new prerequisite
  fastify.post('/subjects/:subjectID/prerequisites', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { subjectID } = req.params as { subjectID: string };
    const { prerequisiteSubjectID } = req.body as { prerequisiteSubjectID: string };
    return createPrerequisite({
      subjectID,
      prerequisiteSubjectID
    });
  });

  // DELETE prerequisite
  fastify.delete('/subjects/:subjectID/prerequisites/:prerequisiteSubjectId', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { subjectID, prerequisiteSubjectId } = req.params as { subjectID: string; prerequisiteSubjectId: string };
    
    // Find the prerequisite record by subject_id and prerequisite_subject_id, then delete
    const prerequisites = await getPrerequisitesBySubjectId(subjectID);
    const prerequisite = prerequisites.find(p => p.prerequisiteSubjectID === prerequisiteSubjectId);
    
    if (!prerequisite) {
      return { deleted: false, message: 'Prerequisite not found' };
    }
    
    return { deleted: await deletePrerequisite(prerequisite.id) };
  });
}

export default subjectPrerequisitesRoutes;