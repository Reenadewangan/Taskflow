

# TaskFlow – Multi-Tenant Project Management SaaS

A full-stack project management platform built using the MERN stack, designed to help teams organize projects, manage tasks, and collaborate efficiently.

## Live Demo

- Frontend: https://taskflow-frontend-ynjz.onrender.com
- Backend API: https://taskflow-fwig.onrender.com

## Features

- User registration and authentication using JWT
- Multi-tenant organization management
- Role-based access control (Admin, Manager, Contributor)
- Project and task management
- Kanban board with drag-and-drop functionality
- Team member management
- Password reset using email OTP
- Light and dark theme

## Tech Stack

Frontend: React, Vite, Axios, CSS

Backend: Node.js, Express.js, MongoDB, Mongoose

Authentication: JWT, bcryptjs

Deployment: Render, MongoDB Atlas

## Project Structure

- `frontend/` – React application
- `backend/` – Express REST API, routes, models, middleware, and database configuration

## Run Locally

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Configure the required environment variables in your local `.env` files before running the application.

## Author

Reena Dewangan
