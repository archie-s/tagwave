# TagWave - Project Structure

```
tagwave/
│
├── backend/                          # Node.js/Express Backend
│   ├── config/
│   │   └── db.js                     # MongoDB connection configuration
│   │
│   ├── controllers/
│   │   ├── authController.js         # Authentication logic
│   │   ├── tagController.js          # NFC tag CRUD operations
│   │   ├── scanController.js         # Scan event handling & analytics
│   │   └── userController.js         # User management (admin)
│   │
│   ├── middleware/
│   │   ├── auth.js                   # JWT authentication & authorization
│   │   ├── error.js                  # Global error handler
│   │   └── validator.js              # Request validation
│   │
│   ├── models/
│   │   ├── User.js                   # User model (roles: user, staff, admin)
│   │   ├── NFCTag.js                 # NFC tag model
│   │   └── ScanEvent.js              # Scan event model
│   │
│   ├── routes/
│   │   ├── auth.js                   # Authentication routes
│   │   ├── tags.js                   # NFC tag routes
│   │   ├── scans.js                  # Scan event routes
│   │   └── users.js                  # User management routes
│   │
│   ├── utils/
│   │   └── auth.js                   # JWT token utilities
│   │
│   ├── package.json                  # Backend dependencies
│   ├── seed.js                       # Database seeding script
│   └── server.js                     # Express server entry point
│
├── frontend/                         # React Frontend
│   ├── public/
│   │   └── index.html                # HTML template
│   │
│   └── src/
│       ├── components/
│       │   ├── Navbar.js             # Navigation bar component
│       │   ├── Navbar.css
│       │   ├── Footer.js             # Footer component
│       │   ├── Footer.css
│       │   └── PrivateRoute.js       # Protected route wrapper
│       │
│       ├── context/
│       │   └── AuthContext.js        # Authentication context & hooks
│       │
│       ├── pages/
│       │   ├── Landing.js            # Landing page (public)
│       │   ├── Landing.css
│       │   ├── About.js              # About page (public)
│       │   ├── About.css
│       │   ├── HowItWorks.js         # How it works page (public)
│       │   ├── HowItWorks.css
│       │   ├── Login.js              # Login page
│       │   ├── Register.js           # Registration page
│       │   ├── Auth.css              # Auth pages styles
│       │   ├── Dashboard.js          # Analytics dashboard (protected)
│       │   ├── Dashboard.css
│       │   ├── TagManagement.js      # Tag CRUD page (staff/admin)
│       │   ├── TagManagement.css
│       │   ├── ScanHandler.js        # Scan redirect handler
│       │   └── ScanHandler.css
│       │
│       ├── services/
│       │   ├── api.js                # Axios instance & interceptors
│       │   ├── authService.js        # Auth API calls
│       │   ├── tagService.js         # Tag API calls
│       │   ├── scanService.js        # Scan API calls
│       │   └── userService.js        # User API calls
│       │
│       ├── App.js                    # Main app component & routing
│       ├── index.js                  # React entry point
│       └── index.css                 # Global styles
│
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── package.json                      # Root package.json
├── README.md                         # Project overview & features
├── API_DOCUMENTATION.md              # Complete API documentation
├── INSTALLATION.md                   # Detailed installation guide
├── QUICKSTART.md                     # Quick start guide
└── PROJECT_STRUCTURE.md              # This file
```

## Key Features by Module

### Backend

**Authentication & Authorization**
- JWT-based authentication
- Role-based access control (user, staff, admin)
- Password hashing with bcrypt
- Token refresh and validation

**NFC Tag Management**
- Create, read, update, delete tags
- Tag activation/deactivation
- Search and filter capabilities
- Tag statistics and analytics

**Scan Event Tracking**
- Log every scan with metadata
- Device type detection
- Browser and OS identification
- IP address tracking
- Time-series analytics

**User Management**
- Admin user management
- Role assignment
- User activation/deactivation

### Frontend

**Public Pages**
- Landing page with features showcase
- About page with mission and target users
- How It Works page with step-by-step guide

**Authentication**
- Login and registration pages
- JWT token management
- Persistent authentication state
- Protected routes

**Analytics Dashboard**
- Real-time statistics cards
- Line charts for scans over time
- Pie charts for device distribution
- Bar charts for browser analytics
- Date range filtering

**Tag Management**
- Table view of all tags
- Create/edit modal forms
- Search and filter functionality
- Toggle active status
- Delete tags (admin only)

**Scan Handling**
- Public scan endpoint
- Automatic redirection
- Scan logging
- Error handling

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: express-validator
- **Password**: bcryptjs

### Frontend
- **Library**: React 18
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: React Icons
- **State Management**: Context API + Hooks

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Tags
- `GET /api/tags` - Get all tags
- `POST /api/tags` - Create tag (staff/admin)
- `GET /api/tags/:id` - Get single tag
- `PUT /api/tags/:id` - Update tag (staff/admin)
- `DELETE /api/tags/:id` - Delete tag (admin)
- `GET /api/tags/scan/:tagId` - Get tag for scanning (public)

### Scans
- `POST /api/scans` - Log scan (public)
- `GET /api/scans` - Get all scans
- `GET /api/scans/analytics` - Get analytics
- `GET /api/scans/stats` - Get statistics

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get single user (admin)
- `PUT /api/users/:id` - Update user (admin)
- `DELETE /api/users/:id` - Delete user (admin)

## Database Schema

### User
- name, email, password (hashed)
- role (user/staff/admin)
- isActive
- timestamps

### NFCTag
- tagId (unique)
- name, description
- destinationUrl
- location
- isActive
- scanCount
- lastScannedAt
- createdBy (ref: User)
- timestamps

### ScanEvent
- tag (ref: NFCTag)
- tagId
- scannedAt
- ipAddress, userAgent
- deviceType, browser, os
- location (optional)
- timestamps

## Security Features

- JWT authentication
- Password hashing
- Role-based authorization
- Input validation
- Rate limiting (100 requests/10min)
- CORS configuration
- Helmet security headers
- Error handling
- XSS protection

## Development Workflow

1. **Setup**: Install dependencies and configure environment
2. **Backend Development**: API endpoints and business logic
3. **Frontend Development**: UI components and pages
4. **Integration**: Connect frontend to backend APIs
5. **Testing**: Manual testing and validation
6. **Seeding**: Populate database with sample data
7. **Deployment**: Production deployment and monitoring

## Getting Started

See [QUICKSTART.md](./QUICKSTART.md) for a 5-minute setup guide.

See [INSTALLATION.md](./INSTALLATION.md) for detailed installation instructions.

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.
