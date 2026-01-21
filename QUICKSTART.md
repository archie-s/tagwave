# TagWave Quick Start Guide

Get TagWave up and running in 5 minutes!

## 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 2. Setup Environment

Create a `.env` file in the root directory:

```bash
MONGODB_URI=mongodb://localhost:27017/tagwave
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

## 3. Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

## 4. Run the Application

**Option A: Run both servers separately**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

**Option B: Run both servers together**

From root directory:
```bash
npm run dev
```

## 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 6. Create Your First Account

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in your details and create an account
4. You'll be automatically logged in

## 7. Make Your First User an Admin

```bash
mongosh tagwave
```

```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

## 8. Create Your First NFC Tag

1. Login as admin/staff user
2. Navigate to "Manage Tags"
3. Click "Create New Tag"
4. Fill in:
   - **Tag ID**: `TAG-001`
   - **Name**: `My First Tag`
   - **Destination URL**: `https://example.com`
5. Click "Create Tag"

## 9. Test Scanning

Visit: `http://localhost:3000/scan/TAG-001`

You should be redirected to your destination URL, and the scan will be logged.

## 10. View Analytics

Navigate to the Dashboard to see:
- Total scans
- Unique users
- Scans over time
- Device and browser breakdowns

## Common Issues

### MongoDB Not Running
```bash
brew services start mongodb-community
```

### Port Already in Use
Change the PORT in `.env` file

### CORS Errors
Update `CLIENT_URL` in backend `.env`:
```
CLIENT_URL=http://localhost:3000
```

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Read the [API Documentation](./API_DOCUMENTATION.md)
- Check the [Installation Guide](./INSTALLATION.md) for detailed setup
- Explore the dashboard and analytics features
- Create more tags and test different scenarios
- Set up production deployment

## Support

For more help, check:
- README.md for project overview
- INSTALLATION.md for detailed setup
- API_DOCUMENTATION.md for API reference

---

**Congratulations! 🎉 You're now ready to use TagWave!**
