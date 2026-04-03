import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { SubjectReservations } from '../types/subject_reservations';
import { createReservation, getAllReservations, getReservationById, getReservationsByStudentId, getReservationsBySubjectId, updateReservationStatus, deleteReservation, InputSubjectReservations } from '../service/subjectReservationsService';

async function subjectReservationsRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
) {
  // GET all reservations (optional, for admin)
  fastify.get('/subject-reservations', async (_req: FastifyRequest, _reply: FastifyReply) => {
    return getAllReservations();
  });

  // GET reservation by ID
  fastify.get('/subject-reservations/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return getReservationById(id);
  });

  // GET reservations by student ID
  fastify.get('/students/:studentID/reservations', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { studentID } = req.params as { studentID: string };
    return getReservationsByStudentId(studentID);
  });

  // GET reservations by subject ID (optional)
  fastify.get('/subjects/:subjectID/reservations', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { subjectID } = req.params as { subjectID: string };
    return getReservationsBySubjectId(subjectID);
  });

  // POST create a new reservation
  fastify.post('/students/:studentID/reservations', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { studentID } = req.params as { studentID: string };
    const { subjectID, status } = req.body as { subjectID: string; status: 'reserved' | 'cancelled' };
    return createReservation({
      studentID,
      subjectID,
      status
    });
  });

  // PATCH update reservation status
  fastify.patch('/subject-reservations/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: 'reserved' | 'cancelled' };
    return updateReservationStatus(id, status);
  });

  // DELETE reservation by reservation ID
  fastify.delete('/students/:studentID/reservations/:reservationId', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { reservationId } = req.params as { reservationId: string };
    return { deleted: await deleteReservation(reservationId) };
  });

  // DELETE reservation (alternative, for direct deletion)
  fastify.delete('/subject-reservations/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    return { deleted: await deleteReservation(id) };
  });
}

export default subjectReservationsRoutes;