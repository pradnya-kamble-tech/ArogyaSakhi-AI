# ArogyaSakhi AI

AI-powered intelligent rural healthcare and emergency assistance platform.

## Project Overview












## Project Goals

ArogyaSakhi AI aims to make rural healthcare more accessible, responsive, and technology-driven by:

- Providing AI-assisted preliminary health assessment
- Connecting patients with ASHA workers and doctors
- Supporting faster emergency response through SOS assistance
- Providing role-based dashboards for different healthcare stakeholders
- Using digital tools to improve healthcare coordination and decision-making

## Tech Stack
- Backend: Python, FastAPI, SQLAlchemy
- Frontend: React, Vite, Axios
- DB: MySQL (preferred) with automatic SQLite fallback for development

## Repository Layout

```
project-root/
├── frontend-modern/
├── backend-fastapi/
├── docs/
├── README.md
├── .gitignore
└── .env.example
```
### Directory Description

- `frontend-modern/` — React + Vite frontend application and user interface.
- `backend-fastapi/` — FastAPI backend containing APIs and server-side logic.
- `docs/` — Project documentation and supporting resources.
- `README.md` — Project overview, setup instructions, and usage information.
## Quickstart

Prerequisites:
- Node 18+ and npm
- Python 3.10+ (venv recommended)
- MySQL server (optional). If unavailable, the app falls back to SQLite (`dev.db`).

Backend (development):

```powershell
cd backend-fastapi
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Frontend (development):

```bash
cd frontend-modern
npm install
npm run dev
# Opens on http://localhost:5173 (or a nearby free port)
```

Production build (frontend):

```bash
cd frontend-modern
npm run build
npm run preview
```

## Environment
Use `.env` at project root or `backend-fastapi/.env` to override defaults. Example values provided in `.env.example`.

## Demo Credentials
- Username: `admin`
- Password: `admin123`



## Contribution & Deployment
Keep changes minimal: do not commit secrets. Use `.env.example` for public examples.




## Prerequisites

- Node.js 18+
- Python 3.12
- MySQL 8+ running locally

## Database

```
HOST=localhost
PORT=3306
DATABASE=arogya_sakhi_ai
USER=root
PASSWORD=root
```

## Backend (FastAPI)

```powershell
cd "healthcare-dss - WITH V\backend-fastapi"
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8001 --host 127.0.0.1
```

API docs: http://127.0.0.1:8001/docs

## Frontend (React + Vite)

```powershell
cd "healthcare-dss - WITH V\frontend-modern"
npm install
npm run dev
```

App: http://localhost:5173

## Demo credentials

| Role | Username | Password |
|------|----------|----------|
| ASHA Worker | pcw1 | pcw123 |
| Doctor | doctor1 | doc123 |
| Patient | patient1 | pat123 |
| Admin | admin | admin123 |
## Project Purpose

ArogyaSakhi AI is designed to support rural healthcare by connecting patients, community health workers, doctors, and administrators through a unified digital platform. It combines AI-assisted health assessment with emergency assistance and role-based healthcare management.

## Future Enhancements

- Integration with additional healthcare and emergency services
- Improved multilingual and voice-based assistance
- Advanced analytics for healthcare workers and administrators
- Secure cloud deployment and scalable infrastructure
The platform is designed with a role-based workflow so that each type of user can access the features and information relevant to their responsibilities.
## Troubleshooting

### Backend does not start
Make sure Python 3.10+ is installed and the required dependencies are installed:

```bash
python -m pip install -r requirements.txt
### Key Benefits

- **Accessible Healthcare:** Helps rural users access preliminary healthcare guidance through a digital platform.
- **Faster Emergency Response:** Enables SOS-based emergency assistance and coordination with healthcare professionals.
- **Better Healthcare Coordination:** Connects patients, ASHA workers, doctors, and administrators through role-based workflows.
- **AI-Assisted Support:** Uses AI to assist with preliminary assessment and healthcare-related decision support.
- **Scalable Architecture:** Built with a modern React frontend and FastAPI backend for future expansion.
## User Roles & Workflow

ArogyaSakhi AI supports different healthcare stakeholders through role-based access.

| Role | Responsibilities |
|------|------------------|
| **Patient** | Access healthcare assistance, perform AI-assisted symptom checks, and raise emergency SOS alerts. |
| **ASHA Worker** | Support patients, coordinate healthcare activities, and respond to assigned cases. |
| **Doctor** | Review patient information and provide professional healthcare support. |
| **Admin** | Manage users, monitor platform activity, and oversee the healthcare system. |

### Typical Workflow

1. Patient registers and accesses the platform.
2. Patient provides symptoms or healthcare information.
3. AI-assisted assessment provides preliminary guidance.
4. Cases can be coordinated with ASHA workers or doctors.
5. Emergency situations can trigger SOS assistance.
6. Healthcare stakeholders manage activities through their respective dashboards.
## System Architecture

ArogyaSakhi AI follows a modern client-server architecture.

```text
┌──────────────────────────┐
│     React + Vite UI      │
│   Patient / ASHA / Doctor│
│          / Admin         │
└────────────┬─────────────┘
             │ HTTP / REST
             ↓
┌──────────────────────────┐
│      FastAPI Backend     │
│ Authentication & APIs    │
│ Healthcare Services      │
│ AI-Assisted Processing   │
└────────────┬─────────────┘
             │
       ┌─────┴─────┐
       ↓           ↓
   Database      AI Logic
 MySQL/SQLite   Assessment