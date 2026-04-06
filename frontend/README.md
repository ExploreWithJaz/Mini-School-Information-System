# Mini School Information System - Frontend

Next.js-based admin dashboard for managing students, courses, subjects, prerequisites, reservations, and grades. Built with React, TypeScript, and Tailwind CSS.

---

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create `.env.local`:

```bash
cp .env.example .env.local
```

Update with backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Start Development Server

```bash
npm run dev
# Open http://localhost:3000 in browser
```

### 4. Login

- Email: `admin@schoolsystem.com`
- Password: `AdminSecure2024!`

---

## 📱 Available Routes

| Page           | URL               | Features                                         |
|----------------|-------------------|--------------------------------------------------|
| Login          | `/login`          | JWT authentication                               |
| Dashboard      | `/dashboard`      | Overview (protected)                             |
| Students       | `/students`       | CRUD, search, filter, bulk delete, inline edit   |
| Courses        | `/courses`        | CRUD, search, filter, bulk delete, inline edit   |
| Subjects       | `/subjects`       | CRUD, prerequisites, bulk delete, inline edit    |
| Grades         | `/grades`         | View/edit grades, audit history, filter          |
| Reservations   | `/reservations`   | Subject reservations (prerequisite checked)      |
| Enrollment     | `/enrollment`     | Student enrollment management                    |
| Admin          | `/adminDashboard` | Admin controls                                   |

_All dashboard routes are protected. Unauthenticated users are redirected to `/login`._

---

## 🔐 Route Protection

Pages use the `useRouteProtection` hook to enforce authentication and roles:

```tsx
import { useRouteProtection } from '@/hooks/useRouteProtection'

export default function AdminDashboard() {
  const { hasAccess, loading } = useRouteProtection({ requiredRoles: ['Admin'] })
  if (loading) return <div>Loading...</div>
  if (!hasAccess) return null
  return <section>{/* Page content */}</section>
}
```

---

## 📊 Key Features

- Search & filter across multiple fields
- Inline editing with validation
- Bulk actions (delete, select all)
- CSV import for students
- Responsive design

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   ├── pages/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   └── lib/
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🚀 Build & Deploy

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

1. Push to GitHub
2. Go to https://vercel.com/new
3. Connect GitHub & select repository
4. Set environment variable: `NEXT_PUBLIC_API_URL=<backend-url>`
5. Deploy

---

## 📦 Technologies

| Layer      | Technology | Version  |
|------------|------------|----------|
| Framework  | Next.js    | 16.2.2   |
| UI Library | React      | 19.2.4   |
| Styling    | Tailwind   | 4.0      |
| Language   | TypeScript | 5.0+     |

---

**Version**: 1.0.0  
**License**: ISC

---

You can copy and use this as your new `README.md` for the frontend. For more info:
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
