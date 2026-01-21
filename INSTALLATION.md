# TagWave Installation Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn

## Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   
   Copy `.env.example` to `.env` in the root directory:
   ```bash
   cp ../.env.example ../.env
   ```

4. **Configure environment variables:**
   
   Edit the `.env` file with your settings:
   ```
   MONGODB_URI=mongodb://localhost:27017/tagwave
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   PORT=5000
   NODE_ENV=development
   JWT_EXPIRE=30d
   ```

5. **Start MongoDB:**
   
   Make sure MongoDB is running:
   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

6. **Start the backend server:**
   ```bash
   npm run dev
   ```

   The backend will run on http://localhost:5000

## Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

   The frontend will run on http://localhost:3000

## Running Both Servers Concurrently

From the root directory:

1. **Install root dependencies:**
   ```bash
   npm install
   ```

2. **Run both servers:**
   ```bash
   npm run dev
   ```

## Creating Admin User

Once the application is running, you can create users via the register page. To make a user an admin or staff member, you need to update their role in the MongoDB database:

1. **Connect to MongoDB:**
   ```bash
   mongosh tagwave
   ```

2. **Update user role:**
   ```javascript
   db.users.updateOne(
     { email: "admin@example.com" },
     { $set: { role: "admin" } }
   )
   ```

   Available roles: `user`, `staff`, `admin`

## API Testing

The API is available at http://localhost:5000/api

Health check endpoint: http://localhost:5000/health

### Example API Calls:

**Register User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Create Tag (requires authentication):**
```bash
curl -X POST http://localhost:5000/api/tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "tagId": "TAG-001",
    "name": "Demo Tag",
    "destinationUrl": "https://example.com"
  }'
```

## Production Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name tagwave-api
   ```

3. Set up MongoDB Atlas or another managed MongoDB service
4. Update `MONGODB_URI` to point to your production database

### Frontend Deployment

1. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy the build folder** to your hosting service:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Your own server with Nginx

3. **Update API URL:**
   
   Set `REACT_APP_API_URL` environment variable to your production API URL

## Troubleshooting

### MongoDB Connection Issues

- Verify MongoDB is running: `mongosh`
- Check MongoDB logs
- Ensure correct connection string in `.env`

### Port Already in Use

If port 5000 or 3000 is already in use:

- Change `PORT` in `.env` for backend
- Frontend will prompt you to use a different port

### CORS Issues

If you experience CORS errors:

- Update `CLIENT_URL` in backend `.env`
- Ensure `cors` configuration in `backend/server.js` matches your frontend URL

## Support

For issues or questions, please refer to the README.md or create an issue in the repository.
