# Productivity Tracker - Setup & Run Guide

## ✅ Environment Status

Your productivity-tracker project is fully set up and ready to run!

### What's Been Configured:

✓ **Node.js Dependencies** - 279 packages installed
✓ **Python Environment** - Python 3.13.5 virtual environment created
✓ **Python Packages** - FastAPI, Transformers, PyTorch, scikit-learn installed
✓ **Database** - SQLite configured with 6 migration tables created
✓ **Configuration** - .env file ready with all required variables

---

## 🚀 Running the Project

### Backend Server (Port 3000)

```bash
npm start
```

The backend will:
- Serve the frontend from `public/` folder
- Run Express.js API on http://localhost:3000
- Use SQLite database at `./data/pt.sqlite3`

**Verify it's running:**
- Open http://localhost:3000 in your browser
- You should see the Productivity Tracker interface

### Python ML Service (Port 8000)

```bash
# From the project root:
.venv\Scripts\python public\main.py
```

Or using the Python executable directly:

```bash
"C:/Mater's Materials/Projects/productivity-tracker/.venv/Scripts/python.exe" public\main.py
```

The ML service will:
- Run FastAPI on http://localhost:8000
- Provide endpoints for:
  - `/classify/app` - Classify if an app is productive
  - `/classify/youtube` - Classify YouTube content
  - `/generate/roadmap` - Generate career roadmaps

---

## 📁 Project Structure

```
productivity-tracker/
├── backend/
│   ├── index.js                 # Express server entry point
│   ├── db.js                    # Database connection
│   ├── middleware/auth.js       # JWT authentication
│   ├── routes/                  # API endpoints
│   ├── utils/                   # Helper functions
│   └── migrations/              # Database schemas (6 tables)
│
├── public/
│   ├── index.html               # Frontend UI
│   ├── app.js                   # Frontend logic
│   ├── styles.css               # Frontend styling
│   └── main.py                  # FastAPI ML service
│
├── ml_service/
│   └── requirements.txt          # Python dependencies
│
├── data/
│   └── pt.sqlite3               # SQLite database (auto-created)
│
├── package.json                 # Node.js dependencies
├── .env                         # Configuration file
├── knexfile.js                  # Database migration config
└── README.md                    # This file
```

---

## 📊 Database Tables

The migrations have created these tables:

1. **users** - User accounts with career/level preferences
2. **user_apps** - Productive apps per user
3. **stats** - Daily productivity statistics
4. **activity_logs** - Timestamped activity records
5. **device_codes** - Device linking codes (6-digit)
6. **devices** - Linked devices per user

---

## 🔧 Configuration (.env)

```ini
JWT_SECRET=super-secret-please-change-it
PORT=3000
DB_PATH=./data/pt.sqlite3
ML_SERVICE_URL=http://localhost:8000
```

**⚠️ Important:** Change `JWT_SECRET` before deploying to production!

---

## 📦 Installed Dependencies

### Node.js (279 packages)
- express, cors, dotenv
- bcrypt, jsonwebtoken (authentication)
- knex, sqlite3 (database)
- axios (HTTP client)

### Python (40+ packages)
- fastapi, uvicorn (API framework)
- transformers, torch (ML models)
- scikit-learn (ML utilities)
- pydantic (data validation)

---

## 🧪 Quick Verification

Run the automated startup test:

```bash
node test-startup.js
```

Expected output:
```
✓ Backend running on http://localhost:3000
✓ Frontend available at http://localhost:3000
✓ Database: ./data/pt.sqlite3
✓ All systems ready!
```

---

## 🔄 Database Operations

### Run migrations (create tables):
```bash
npm run migrate
```

### Access the database:
```bash
sqlite3 data/pt.sqlite3
```

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### User Management
- `GET /api/user/me` - Get current user
- `PUT /api/user/career` - Set career
- `PUT /api/user/level` - Set experience level
- `PUT /api/user/dailyMinutes` - Set daily goal
- `PUT /api/user/apps` - Save productive apps

### Statistics
- `GET /api/stats/today` - Today's stats
- `PATCH /api/stats/today` - Log activity
- `GET /api/stats/history?date=YYYY-MM-DD` - Historical data

### Roadmap & Goals
- `GET /api/roadmap/:careerId` - Get career roadmap

### Device Linking
- `POST /api/devices/generateCode` - Generate 6-digit code
- `POST /api/devices/link` - Link a device
- `GET /api/devices` - List linked devices
- `DELETE /api/devices/:id` - Unlink device

---

## 🐛 Troubleshooting

### Port 3000 already in use?
```bash
# Change PORT in .env file
PORT=3001 npm start
```

### Database errors?
```bash
# Reset database (deletes all data!)
rm data/pt.sqlite3
npm run migrate
```

### Python dependencies missing?
```bash
# Reinstall Python packages
.venv\Scripts\pip install -r ml_service/requirements.txt
```

### Port 8000 already in use?
```bash
# Change ML_SERVICE_URL in .env and the Python startup command
```

---

## 📚 Next Steps

1. **Start the backend:** `npm start`
2. **Open browser:** http://localhost:3000
3. **Create an account:** Sign up with email/password
4. **Choose career:** Select your profession path
5. **Set preferences:** Experience level, daily time, apps
6. **Start tracking:** Mark habits and focus sessions

---

## 📄 License

MIT

---

**Setup completed on:** December 8, 2025
**Node version:** v25.2.1
**Python version:** 3.13.5
