# TagWave API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### Login
**POST** `/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

### Get Current User
**GET** `/auth/me`

Get currently authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2024-01-14T10:00:00.000Z"
  }
}
```

---

## NFC Tag Endpoints

### Get All Tags
**GET** `/tags`

Get all NFC tags (requires authentication).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `isActive` (optional): `true` or `false`
- `search` (optional): Search by name or tagId

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "tagId": "TAG-001",
      "name": "Product Demo Tag",
      "description": "Demo tag for product showcase",
      "destinationUrl": "https://example.com/product",
      "isActive": true,
      "scanCount": 42,
      "location": "Store Front",
      "lastScannedAt": "2024-01-14T10:00:00.000Z",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Staff",
        "email": "jane@example.com"
      },
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

---

### Get Single Tag
**GET** `/tags/:id`

Get a single tag by ID (requires authentication).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tagId": "TAG-001",
    "name": "Product Demo Tag",
    "destinationUrl": "https://example.com/product",
    "isActive": true,
    "scanCount": 42
  }
}
```

---

### Get Tag by Tag ID (Public)
**GET** `/tags/scan/:tagId`

Get tag information for scanning (public endpoint).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "tagId": "TAG-001",
    "name": "Product Demo Tag",
    "destinationUrl": "https://example.com/product"
  }
}
```

---

### Create Tag
**POST** `/tags`

Create a new NFC tag (requires staff or admin role).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "tagId": "TAG-001",
  "name": "Product Demo Tag",
  "description": "Demo tag for product showcase",
  "destinationUrl": "https://example.com/product",
  "location": "Store Front",
  "isActive": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tagId": "TAG-001",
    "name": "Product Demo Tag",
    "destinationUrl": "https://example.com/product",
    "isActive": true,
    "scanCount": 0
  }
}
```

---

### Update Tag
**PUT** `/tags/:id`

Update an existing tag (requires staff or admin role).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Tag Name",
  "destinationUrl": "https://example.com/new-url",
  "isActive": false
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "tagId": "TAG-001",
    "name": "Updated Tag Name",
    "destinationUrl": "https://example.com/new-url",
    "isActive": false
  }
}
```

---

### Delete Tag
**DELETE** `/tags/:id`

Delete a tag (requires admin role).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

---

### Get Tag Statistics
**GET** `/tags/:id/stats`

Get statistics for a specific tag.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalScans": 42,
    "uniqueScans": 28,
    "lastScannedAt": "2024-01-14T10:00:00.000Z"
  }
}
```

---

## Scan Event Endpoints

### Log Scan Event
**POST** `/scans`

Log a new scan event (public endpoint).

**Request Body:**
```json
{
  "tagId": "TAG-001"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "destinationUrl": "https://example.com/product",
    "scanEvent": "507f1f77bcf86cd799439011"
  }
}
```

---

### Get All Scans
**GET** `/scans`

Get all scan events (requires authentication).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `tagId` (optional): Filter by tag ID
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `limit` (optional): Limit number of results (default: 100)

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "tag": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Product Demo Tag",
        "tagId": "TAG-001"
      },
      "tagId": "TAG-001",
      "scannedAt": "2024-01-14T10:00:00.000Z",
      "deviceType": "mobile",
      "browser": "Chrome",
      "os": "Android"
    }
  ]
}
```

---

### Get Analytics
**GET** `/scans/analytics`

Get comprehensive analytics data.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `tagId` (optional): Filter by tag ID
- `startDate` (optional): Start date filter
- `endDate` (optional): End date filter

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalScans": 150,
    "uniqueScans": 98,
    "scansByDevice": [
      { "_id": "mobile", "count": 100 },
      { "_id": "desktop", "count": 30 },
      { "_id": "tablet", "count": 20 }
    ],
    "scansByBrowser": [
      { "_id": "Chrome", "count": 80 },
      { "_id": "Safari", "count": 50 },
      { "_id": "Firefox", "count": 20 }
    ],
    "scansOverTime": [
      { "_id": "2024-01-10", "count": 25 },
      { "_id": "2024-01-11", "count": 30 },
      { "_id": "2024-01-12", "count": 28 }
    ],
    "topTags": [
      { "_id": "TAG-001", "count": 80 },
      { "_id": "TAG-002", "count": 70 }
    ]
  }
}
```

---

### Get Statistics Summary
**GET** `/scans/stats`

Get overall statistics summary.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalScans": 1250,
    "scansLast7Days": 85,
    "scansLast30Days": 320,
    "uniqueUsers": 450,
    "activeTags": 15
  }
}
```

---

## User Management Endpoints (Admin Only)

### Get All Users
**GET** `/users`

Get all users (admin only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

---

### Update User
**PUT** `/users/:id`

Update user information (admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "role": "staff",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Updated",
    "email": "john@example.com",
    "role": "staff",
    "isActive": true
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

**Response (4xx/5xx):**
```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common Error Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## User Roles

- **user**: Can view analytics and their own data
- **staff**: Can create and manage NFC tags
- **admin**: Full access including user management

---

## Rate Limiting

API requests are limited to 100 requests per 10 minutes per IP address.
