# CECMS - College Event & Club Management System

CECMS is a full-stack club and event management platform designed for colleges and universities. It streamlines student participation, club governance, event scheduling, attendance tracking, and administrative approval workflows (such as club proposals, event authorizations, and budget allocations).

---

## 🌟 Key Features

### 🔐 Authentication & Role-Based Access Control (RBAC)
- Multi-role support: **Admin**, **Club Leader**, and **Student**.
- Secure authentication using JWT access tokens and hashed passwords (bcrypt).
- Protected endpoints with role-specific permission guards.

### 🏛️ Club Management
- Browse, discover, and join campus clubs.
- Club leadership assignments and member roster tracking.
- Club registration and creation approval workflows managed by administrators.

### 📅 Event Scheduling & Lifecycle
- Propose new events with venue, timing, and capacity specifications.
- Formal approval pipelines for event requests and budget allocations.
- Real-time event discovery and calendar view for students.

### 🎟️ Registrations & Attendance Tracking
- One-click student RSVP and event registrations.
- Check-in and attendance marking functionality for event organizers.
- Attendance statistics and capacity monitoring.

### 📊 Reporting & Administrative Governance
- Comprehensive dashboards for club performance and student engagement.
- Budget request tracking and approval status.
- System-wide reports on active memberships, event turnout, and resource utilization.

---

## 🛠️ Tech Stack

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database & ORM:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) with SQLite (local) and PostgreSQL (production)
- **Migrations:** [Alembic](https://alembic.sqlalchemy.org/)
- **Data Validation:** [Pydantic v2](https://docs.pydantic.dev/)
- **Security:** Passlib, Bcrypt, Python-Jose (JWT)
- **Server:** [Uvicorn](https://www.uvicorn.org/)

### Frontend
- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Material UI (MUI)](https://mui.com/)
- **State & Server Cache:** [TanStack React Query](https://tanstack.com/query)
- **Routing:** [React Router DOM v7](https://reactrouter.com/)
- **HTTP Client:** [Axios](https://axios-http.com/)

---

## 📂 Project Structure

```text
CECMS/
├── backend/
│   ├── alembic/              # Database migration scripts
│   ├── app/
│   │   ├── core/             # Auth, security, and application configs
│   │   ├── models/           # SQLAlchemy ORM models (User, Club, Event, etc.)
│   │   ├── routers/          # API route handlers (auth, club, event, etc.)
│   │   ├── schemas/          # Pydantic request and response schemas
│   │   ├── database.py       # Database connection and session management
│   │   └── main.py           # FastAPI entrypoint and middleware setup
│   ├── requirements.txt      # Python dependencies
│   └── test_rbac.py          # RBAC unit and integration test suite
├── frontend/
│   ├── public/               # Static assets
│   ├── src/                  # React source code (components, pages, hooks, services)
│   ├── package.json          # Node dependencies and scripts
│   ├── vite.config.ts        # Vite configuration
│   └── vercel.json           # Vercel deployment configuration
├── render.yaml               # Render blueprint for backend and PostgreSQL deployment
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** 18.x or higher (npm / yarn / pnpm)
- **Git**

---

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate

   # Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (optional for local SQLite development):
   Create a `.env` file in the `backend/` folder:
   ```env
   DATABASE_URL=sqlite:///./cecms.db
   SECRET_KEY=your_super_secret_jwt_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   - API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Alternative Docs (ReDoc): [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 🚢 Deployment

- **Backend:** Ready for deployment on [Render](https://render.com/) via `render.yaml`. Includes automated PostgreSQL provisioning and database URL configuration.
- **Frontend:** Pre-configured for deployment on [Vercel](https://vercel.com/) with single-page app rewrites via `frontend/vercel.json`.

---

## 👥 Contributors & Branching

- Main development is managed across feature and team branches (`dev`, `Prod`, `Stagging`, `jason`).
- For new features, branch off `dev` or `main` and submit a Pull Request.
