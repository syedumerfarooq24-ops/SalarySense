Markdown
# 🤖 SalarySense AI — Salary Prediction & Analytics Dashboard

SalarySense AI is a full-stack, machine-learning-powered application designed to estimate employee annual salaries, provide confidence intervals, analyze key feature impacts, and render interactive analytics dashboards in real time.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React 18 + TypeScript + Vite
- **Routing:** TanStack Router (`@tanstack/react-router`)
- **State & Data Fetching:** TanStack Query (`@tanstack/react-query`)
- **Data Visualization:** Recharts
- **Styling:** Tailwind CSS + Radix UI components

### **Backend**
- **API Framework:** FastAPI (Python)
- **Machine Learning:** Scikit-Learn (RandomForestRegressor) / PyTorch
- **Database:** Supabase (PostgreSQL)
- **ASGI Server:** Uvicorn

---

## 📁 Repository Structure

```text
SalarySense/
├── backend/                  # FastAPI backend service
│   ├── app/                  # Main application & router handlers
│   │   ├── ml/               # Model inference logic
│   │   └── routers/          # API endpoints (predict, history, analytics, model)
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables (local server configuration)
├── frontend/                 # React frontend application
│   ├── src/                  # Components, routes, hooks, and API queries
│   ├── package.json          # Node dependencies
│   └── .env.local            # Frontend environment configuration
├── .gitignore                # Root Git ignore rules
└── README.md                 # Project documentation
🚀 Local Development Setup
1. Prerequisites
Python 3.10+

Node.js 18+ and npm (or bun)

2. Backend Setup (FastAPI)
Navigate to the backend directory:

Bash
cd backend
Create and activate a Python virtual environment:

Bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
Install requirements:

Bash
pip install -r requirements.txt
Create a .env file inside backend/:

Code snippet
MODEL_PATH=salary_model.pkl
APP_VERSION=1.0.0
# Add Supabase credentials if using remote database
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_key
Run the FastAPI development server:

Bash
uvicorn app.main:app --reload --port 8000
FastAPI Docs available at http://localhost:8000/docs

3. Frontend Setup (React)
Open a new terminal and navigate to the frontend directory:

Bash
cd frontend
Install dependencies:

Bash
npm install
Create a .env.local file inside frontend/:

Code snippet
VITE_API_BASE_URL=http://localhost:8000
Start the Vite development server:

Bash
npm run dev