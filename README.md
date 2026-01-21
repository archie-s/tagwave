# TagWave - NFC Tag Management & Analytics Platform

A production-ready MERN stack application for managing and analyzing NFC tags.

## Tech Stack

- **Frontend**: React.js (functional components, hooks)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **Charts**: Recharts
- **API Style**: REST

## Features

- 🔐 JWT Authentication & Role-Based Authorization
- 📊 Real-time Analytics Dashboard
- 🏷️ NFC Tag Programming & Management
- 📈 Scan Event Tracking
- 👥 User Role Management (User, Staff, Admin)
- 📱 Responsive Design

## Project Structure

```
tagwave/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
└── frontend/
    ├── public/
    └── src/
        ├── components/
        ├── pages/
        ├── services/
        ├── context/
        └── App.js
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Create `.env` file in the root directory:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   NODE_ENV=development
   ```

4. Run the application:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### NFC Tags
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create new tag (Staff only)
- `GET /api/tags/:id` - Get tag by ID
- `PUT /api/tags/:id` - Update tag (Staff only)
- `DELETE /api/tags/:id` - Delete tag (Admin only)

### Scan Events
- `POST /api/scans` - Log a scan event
- `GET /api/scans` - Get all scans
- `GET /api/scans/analytics` - Get analytics data

### Users
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)

## User Roles

- **User**: Can view analytics
- **Staff**: Can create and manage NFC tags
- **Admin**: Full access including user management

## License

MIT
