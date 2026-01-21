# 🚀 TagWave - Quick Reference Card

## 📦 Installation

```bash
# Install all dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup environment
cp .env.example .env
```

## ▶️ Running the App

**Option 1: Separate terminals**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

**Option 2: Concurrently (from root)**
```bash
npm run dev
```

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5000/health

## 🔑 Test Accounts (after seeding)

```bash
# Run seed script
cd backend && npm run seed
```

- **Admin**: admin@tagwave.com / password123
- **Staff**: staff@tagwave.com / password123  
- **User**: user@tagwave.com / password123

## 📊 Key Features

### Public Pages
- `/` - Landing page
- `/about` - About TagWave
- `/how-it-works` - Step-by-step guide
- `/login` - Login page
- `/register` - Sign up page

### Protected Pages
- `/dashboard` - Analytics dashboard (all users)
- `/tags` - Tag management (staff/admin)
- `/users` - User management (admin only)

### Scan Handler
- `/scan/:tagId` - Public scan redirect

## 🔐 User Roles

| Role | Dashboard | Manage Tags | Manage Users |
|------|-----------|-------------|--------------|
| User | ✅ | ❌ | ❌ |
| Staff | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ |

## 🛠️ API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user

### Tags
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag (staff+)
- `PUT /api/tags/:id` - Update tag (staff+)
- `DELETE /api/tags/:id` - Delete tag (admin)

### Scans
- `POST /api/scans` - Log scan (public)
- `GET /api/scans/analytics` - Analytics
- `GET /api/scans/stats` - Statistics

### Users
- `GET /api/users` - List users (admin)
- `PUT /api/users/:id` - Update user (admin)

## 🔧 Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/tagwave
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
JWT_EXPIRE=30d
```

## 📝 Common Commands

```bash
# Start MongoDB
brew services start mongodb-community

# Seed database
cd backend && npm run seed

# Build frontend for production
cd frontend && npm run build

# Install new dependency
npm install package-name

# Check MongoDB
mongosh tagwave
```

## 🎯 Quick Tasks

### Create Admin User
```javascript
// In mongosh
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

### Create Your First Tag
1. Login as staff/admin
2. Go to "Manage Tags"
3. Click "Create New Tag"
4. Fill in details and save

### Test Scanning
Visit: `http://localhost:3000/scan/TAG-001`

## 📚 Documentation

- `README.md` - Project overview
- `QUICKSTART.md` - 5-minute setup
- `INSTALLATION.md` - Detailed setup
- `API_DOCUMENTATION.md` - API reference
- `PROJECT_STRUCTURE.md` - Architecture
- `DEPLOYMENT_SUMMARY.md` - Complete summary

## 🐛 Troubleshooting

**MongoDB not running?**
```bash
brew services start mongodb-community
```

**Port already in use?**
Change PORT in `.env`

**CORS errors?**
Update CLIENT_URL in backend `.env`

**Dependencies issues?**
```bash
rm -rf node_modules package-lock.json
npm install
```

## 🎨 Tech Stack

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs, helmet, cors

**Frontend**
- React 18
- React Router v6
- Axios
- Recharts
- Context API

## 📊 Analytics Features

- Total scans counter
- Unique users tracking
- Scans over time (line chart)
- Device type distribution (pie chart)
- Browser analytics (bar chart)
- Top performing tags
- Date range filtering

## 🎯 What's Included

✅ Complete backend API (15+ endpoints)
✅ React frontend with 9 pages
✅ Authentication & authorization
✅ Real-time analytics dashboard
✅ Tag management system
✅ Role-based access control
✅ Database seeding script
✅ Comprehensive documentation
✅ Production-ready code

## 🚀 Next Steps

1. ✅ Follow QUICKSTART.md
2. ✅ Run the application
3. ✅ Test all features
4. ✅ Customize as needed
5. ✅ Deploy to production

---

**Need more details?** Check the full documentation files in the project root.

**Have questions?** Review the code comments - everything is well documented!

**Ready to deploy?** See INSTALLATION.md for production deployment guide.
