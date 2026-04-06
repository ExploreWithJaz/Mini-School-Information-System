import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { SubjectReservations } from '../types/subject_reservations';
import { createReservation, getAllReservations, getReservationById, getReservationsByStudentId, getReservationsBySubjectId, updateReservationStatus, deleteReservation, InputSubjectReservations } from '../service/subjectReservationsService';
import { authenticate } from '../middleware/authMiddleware';

async function subjectReservationsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all reservations - PROTECTED
  fastify.get('/subject-reservations', 
    { onRequest: [authenticate] },
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      return getAllReservations();
    }
  );

  // GET reservation by ID - PROTECTED
  fastify.get('/subject-reservations/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      return getReservationById(id);
    }
  );

  // GET reservations by student ID - PROTECTED
  fastify.get('/students/:studentID/reservations', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { studentID } = req.params as { studentID: string };
      return getReservationsByStudentId(studentID);
    }
  );

  // GET reservations by subject ID - PROTECTED
  fastify.get('/subjects/:subjectID/reservations', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { subjectID } = req.params as { subjectID: string };
      return getReservationsBySubjectId(subjectID);
    }
  );

  // POST create a new reservation - PROTECTED
  fastify.post('/students/:studentID/reservations', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { studentID } = req.params as { studentID: string };
      const { subjectID, status } = req.body as { subjectID: string; status: 'reserved' | 'cancelled' };
      return createReservation({
        studentID,
        subjectID,
        status
      });
    }
  );

  // PATCH update reservation status - PROTECTED
  fastify.patch('/subject-reservations/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      const { status } = req.body as { status: 'reserved' | 'cancelled' };
      return updateReservationStatus(id, status);
    }
  );

  // DELETE reservation by student and reservation ID - PROTECTED
  fastify.delete('/students/:studentID/reservations/:reservationId', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { reservationId } = req.params as { reservationId: string };
      return { deleted: await deleteReservation(reservationId) };
    }
  );

  // DELETE reservation by ID - PROTECTED
  fastify.delete('/subject-reservations/:id', 
    { onRequest: [authenticate] },
    async (req: FastifyRequest, _reply: FastifyReply) => {
      const { id } = req.params as { id: string };
      return { deleted: await deleteReservation(id) };
    }
  );
}

export default subjectReservationsRoutes;