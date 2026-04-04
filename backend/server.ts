// server.ts (rename from server.js)
import 'dotenv/config';
import fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import studentRoutes from './routes/students';
import courseRoutes from './routes/course';
import gradesRoutes from './routes/grades';
import subjectsRoutes from './routes/subjects';
import usersRoutes from './routes/users';
import subjectPrerequisitesRoutes from './routes/subjectPrerequisites';
import subjectReservationsRoutes from './routes/subjectReservations';
import authRoutes from './routes/auth';

const app = fastify({ logger: true });

// register plugins
app.register(cors, {
  origin: true, // Allow all origins (use specific URL in production)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
app.register(cookie);

app.register(studentRoutes);
app.register(courseRoutes);
app.register(gradesRoutes);
app.register(subjectsRoutes);
app.register(usersRoutes);
app.register(subjectPrerequisitesRoutes);
app.register(subjectReservationsRoutes);
app.register(authRoutes);

// test route
app.get('/', async () => {
  return { message: 'SIS API running 🚀' };
});

// start server
const start = async () => {
  try {
    await app.listen({ port: 3001 });
    console.log('Server running on http://localhost:3001');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();