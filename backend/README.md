# Mini School Information System - Backend

Fastify-based REST API for the School Information System. Manages students, courses, subjects, prerequisites, reservations, and digital grading with JWT authentication and PostgreSQL database.

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

**Required packages**:
- `fastify`: Web framework
- `@fastify/cors`: CORS support
- `@fastify/multipart`: File upload handling
- `@fastify/cookie`: Cookie management
- `pg`: PostgreSQL client
- `jsonwebtoken`: JWT authentication
- `bcrypt`: Password encryption
- `dotenv`: Environment variables

### 2. Create PostgreSQL Database

#### Using PostgreSQL CLI:
```bash
# Start PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql # macOS

# Create database
psql -U postgres

CREATE DATABASE sis_db;

# Verify creation
\l

# Exit
\q
```

#### Using pgAdmin (GUI):
1. Open pgAdmin
2. Right-click "Databases" → "Create" → "Database"
3. Name: `sis_db`
4. Click "Save"

### 3. Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL credentials:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production

# Database Configuration
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_NAME=sis_db
DB_PORT=5432

# Server Configuration
SERVER_PORT=3001
NODE_ENV=development
```

**⚠️ Important**:
- Change `JWT_SECRET` to a random string (min 32 characters)
- Update `DB_PASSWORD` to match your PostgreSQL password

### 4. Seed Database

```bash
# Create tables and populate with initial data
npm run seed
```

**Seed script creates**:
- ✅ Admin user: `admin@schoolsystem.com` / `AdminSecure2024!`
- ✅ 4 courses (Computer Science, Engineering, Business, Arts)
- ✅ 40 subjects (8 general education + 8 per course)
- ✅ 50 students (randomly assigned to courses)
- ✅ Sample prerequisites links
- ✅ Audit logs table

### 5. Start Development Server

```bash
npm run dev

# Server runs on http://localhost:3001
```

---

## 🔐 Admin Credentials

**Default admin account** (created during seed):

| Field | Value |
|-------|-------|
| **Email** | `admin@schoolsystem.com` |
| **Password** | `AdminSecure2024!` |
| **Role** | `admin` |

⚠️ **Change in production!**

---

## 📋 Key Assumptions & Validation Rules

This system implements the following business rules for prerequisite validation and grading:

### Prerequisite "Taken/Passed" Definition

A prerequisite is considered **satisfied** if:
- The student has a **grade record** for that prerequisite subject in the `grades` table
- The system assumes any grade record means the prerequisite was taken/passed
- There is **no passing grade threshold check** for prerequisites - existence of a grade satisfies the prerequisite

**Rationale:** This follows **Option A** from the exam specification, keeping prerequisite tracking simple while maintaining data integrity through the grading system.

### Grading Scale

The system uses the following grading scale:
- **1.00 - 3.00**: Passing grades (highest to lowest passing)
- **5.00**: Failed grades
- **Remarks field**: `PASSED` or `FAILED` (automatically set based on grade)

Grades are calculated as the average of prelim, midterm, and finals exam scores.

### Subject Reservation Validation

When a student attempts to reserve a subject, the system validates:

1. **Course Scoping**: `student.course_id == subject.course_id`
   - Students can only reserve subjects within their enrolled course

2. **Prerequisite Enforcement**: All prerequisites must be satisfied
   - If prerequisites are missing, the system returns:
     ```
     400 Bad Request: Missing prerequisites: [SUBJ101, SUBJ102]
     ```
   - Where codes are subject codes of unsatisfied prerequisites
   - Prerequisites are sorted alphabetically for consistency

3. **No Duplicate Reservations**: Student cannot have two active reservations for the same subject

4. **No Reserved-After-Completion**: Student cannot reserve a subject they already have a grade for

### CSV Student Import

The import feature accepts CSV files with the following required headers:
- `student_number` - Unique student identifier
- `first_name` - First name
- `last_name` - Last name
- `email` - Email address (must be valid format)
- `birth_date` - Birth date (YYYY-MM-DD format)
- `course_id` - UUID of the course to assign student to

Invalid rows are skipped, and a summary is returned with success/failure counts and specific error messages for each failed row.

### Audit Logging

Grade modifications are logged automatically:
- **Tracked fields:** Any field that changes (prelim, midterm, finals, final_grade, remarks)
- **Who modified**: User ID and email of the person making the change
- **When modified**: Timestamp of each modification
- **Old/New values**: Previous and new values for comparison

Accessible via: `GET /students/:studentID/grade-audit-logs`

---

## 📁 Project Structure

```
backend/
├── db/
│   └── connection.ts           PostgreSQL connection pool
├── routes/                     API endpoints
│   ├── auth.ts                 Authentication
│   ├── students.ts             Student CRUD + import
│   ├── courses.ts              Course CRUD
│   ├── subjects.ts             Subject CRUD
│   ├── grades.ts               Grade CRUD + audit logs
│   ├── subjectReservations.ts  Reservations + prerequisites
│   ├── subjectPrerequisites.ts Prerequisites management
│   └── users.ts                User management
├── service/                    Business logic
│   ├── authService.ts
│   ├── studentsService.ts
│   ├── gradesService.ts        (includes audit log logic)
│   └── ...
├── types/                      TypeScript interfaces
├── server.ts                   Fastify server setup + middleware
├── seed.ts                     Database seeder (creates tables + sample data)
├── reset-seed.ts               Database reset script
├── .env                        Environment variables
├── package.json
└── README.md
```

---

## 📦 Tech Stack

| Layer | Technology | Version |
|-------|-----------|----------|
| Framework | Fastify | 5.8.4 |
| Runtime | Node.js | 18+ |
| Database | PostgreSQL | 12+ |
| Auth | JWT | 9.0.3 |
| Encryption | bcrypt | 6.0.0 |
| Language | TypeScript | 5+ |

---

**Version**: 1.0.0  
**License**: ISC
EOF
