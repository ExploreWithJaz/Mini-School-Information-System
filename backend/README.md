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

### Prerequisites: "Taken/Passed" Rule
A student has satisfied a prerequisite when:
- A grade record exists for the prerequisite subject
- **AND** (`final_grade >= 75.0` OR `remarks = 'PASSED'`)

### Passing Grade Threshold
```
Final Grade Calculation: (Prelim × 0.2) + (Midterm × 0.3) + (Finals × 0.5)
Passing Threshold: 75.0
Remarks: Automatically set to 'PASSED' if final_grade >= 75.0, else 'FAILED'
```

### Reservation Behavior - Missing Prerequisites
When a student attempts to reserve a subject with unmet prerequisites:

**Error Response** (HTTP 400):
```json
{
  "statusCode": 400,
  "message": "Cannot reserve subject. Missing prerequisites: [CS101, CS102]",
  "missingPrerequisites": ["CS101", "CS102"]
}
```

The reservation is **rejected** and the student must complete the prerequisite subjects first (verified by grade records meeting the passing threshold).

### CSV Import Validation
- Required columns: `student_number, first_name, last_name, email, birth_date, course_id`
- Valid email format required
- Valid date format: YYYY-MM-DD
- Course must exist in database
- No duplicate student numbers allowed

### Prerequisite Integrity
- No self-references (subject ≠ prerequisite)
- No circular chains (A→B→C→A prevented)
- Prerequisites must be same course as target subject

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
