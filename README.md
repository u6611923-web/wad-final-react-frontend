# Online Course Service — React Frontend

**CSX4107 Web Application Development — Final Examination 2026**

## Project Description

This is the React frontend for the Online Course Service application.

The application supports role-based interfaces for Students and Teachers and communicates with a Next.js backend API.

## Technology Stack

- React
- Vite
- React Router
- CSS
- Fetch API

## Features

### Teacher
- Login
- View own courses
- Create and edit courses
- View course details and enrolled Students
- Delete courses with no enrollments

### Student
- Login
- Browse available courses
- Search by course name or Teacher name
- View course details
- Enroll in Open courses when seats remain
- View My Courses

## Test Accounts

**Shared test password:** `REPLACE_WITH_YOUR_SEED_PASSWORD`

| Role | Email |
|---|---|
| Teacher | teacher1@example.com |
| Teacher | teacher2@example.com |
| Teacher | teacher3@example.com |
| Student | student1@example.com |
| Student | student2@example.com |
| Student | student3@example.com |

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

Start the React development server:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Production Build

```bash
npm run build
```

## Live Application

https://wad-final-react-frontend.vercel.app

## Backend API

(https://vercel.com/u6611923-3001/wad-final-next-backend/settings/environment-variables)

## GitHub Repositories

**Frontend:** https://github.com/u6611923-web/wad-final-react-frontend

**Backend:** https://github.com/u6611923-web/wad-final-next-backend
