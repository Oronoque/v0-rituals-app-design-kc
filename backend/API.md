# Rituals App API Specification

## Base URL

```
http://localhost:3001/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "currentStreak": 0,
    "proofScore": 1.0,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt_token_here"
}
```

### POST /auth/login

Login with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "currentStreak": 37,
    "proofScore": 1.45,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt_token_here"
}
```

### GET /auth/me

Get current user information (requires auth).

**Response (200):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "currentStreak": 37,
  "proofScore": 1.45,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## 🎯 Ritual Management Endpoints

### GET /rituals

Get user's private rituals (requires auth).

**Query Parameters:**

- `category` (optional): Filter by category
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**

```json
{
  "rituals": [
    {
      "id": "uuid",
      "name": "Morning Routine",
      "description": "My daily morning ritual",
      "category": "Wellness",
      "location": "Bedroom",
      "gear": ["Journal", "Water bottle"],
      "isPublic": false,
      "forkedFromId": null,
      "forkCount": 0,
      "completionCount": 45,
      "userId": "uuid",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "steps": [
        {
          "id": "uuid",
          "type": "yesno",
          "name": "Drink water",
          "question": "Did you drink a glass of water?",
          "completed": false,
          "orderIndex": 0
        }
      ],
      "completed": false,
      "wasModified": false
    }
  ],
  "total": 5
}
```

### GET /rituals/public

Get public rituals library.

**Query Parameters:**

- `search` (optional): Search term
- `category` (optional): Filter by category
- `limit` (optional): Number of results (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `sortBy` (optional): Sort field (name, forkCount, completionCount, createdAt)
- `sortOrder` (optional): asc or desc (default: desc)

**Response (200):**

```json
{
  "rituals": [
    {
      "id": "uuid",
      "name": "5-Minute Morning Energizer",
      "description": "Quick morning routine to boost energy",
      "category": "Wellness",
      "location": null,
      "gear": [],
      "isPublic": true,
      "forkedFromId": null,
      "forkCount": 156,
      "completionCount": 2341,
      "userId": "creator_uuid",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "steps": [...]
    }
  ],
  "total": 42
}
```

### POST /rituals

Create a new ritual (requires auth).

**Request Body:**

```json
{
  "name": "My New Ritual",
  "description": "A custom ritual for my needs",
  "category": "Productivity",
  "location": "Office",
  "gear": ["Notebook", "Pen"],
  "steps": [
    {
      "type": "yesno",
      "name": "Clear desk",
      "question": "Is your desk clear and organized?"
    },
    {
      "type": "qa",
      "name": "Set intention",
      "question": "What is your main goal for today?"
    },
    {
      "type": "weightlifting",
      "name": "Push-ups",
      "question": "Do 3 sets of push-ups",
      "weightliftingConfig": [
        { "reps": 10, "weight": 0 },
        { "reps": 8, "weight": 0 },
        { "reps": 6, "weight": 0 }
      ]
    }
  ]
}
```

**Response (201):**

```json
{
  "id": "uuid",
  "name": "My New Ritual",
  "description": "A custom ritual for my needs",
  "category": "Productivity",
  "location": "Office",
  "gear": ["Notebook", "Pen"],
  "isPublic": false,
  "forkedFromId": null,
  "forkCount": 0,
  "completionCount": 0,
  "userId": "uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "steps": [
    {
      "id": "uuid",
      "type": "yesno",
      "name": "Clear desk",
      "question": "Is your desk clear and organized?",
      "completed": false,
      "orderIndex": 0
    }
  ],
  "completed": false,
  "wasModified": false
}
```

### GET /rituals/:id

Get a specific ritual by ID.

### PUT /rituals/:id

Update a ritual (requires auth and ownership).

### DELETE /rituals/:id

Delete a ritual (requires auth and ownership).

### POST /rituals/:id/fork

Fork a public ritual to user's private library (requires auth).

**Response (201):**

```json
{
  "id": "new_uuid",
  "name": "5-Minute Morning Energizer",
  "forkedFromId": "original_uuid",
  "isPublic": false,
  "userId": "current_user_uuid"
  // ... rest of ritual data with new IDs
}
```

### POST /rituals/:id/publish

Publish a private ritual to public library (requires auth and ownership).

**Response (200):**

```json
{
  "id": "uuid",
  "isPublic": true
  // ... updated ritual data
}
```

### POST /rituals/:id/unpublish

Remove a ritual from public library (requires auth and ownership).

---

## 📅 Daily Flow & Scheduling Endpoints

### GET /daily-rituals/:date

Get scheduled rituals for a specific date (requires auth).

**Parameters:**

- `date`: Date in YYYY-MM-DD format

**Response (200):**

```json
{
  "dailyRituals": [
    {
      "id": "uuid",
      "userId": "uuid",
      "templateId": "uuid",
      "scheduledDate": "2024-01-15",
      "scheduledTime": "06:00",
      "completed": false,
      "wasModified": false,
      "completedAt": null,
      "ritual": {
        // Full ritual object
      },
      "steps": [
        {
          "id": "uuid",
          "type": "yesno",
          "name": "Wake up early",
          "completed": false,
          "answer": null,
          "wasModified": false
        }
      ]
    }
  ]
}
```

### POST /daily-rituals

Schedule a ritual for specific date(s) (requires auth).

**Request Body:**

```json
{
  "ritualId": "uuid",
  "scheduledDate": "2024-01-15",
  "scheduledTime": "06:00",
  "frequencyType": "daily",
  "frequencyData": {
    "daysOfWeek": [1, 2, 3, 4, 5]
  },
  "endDate": "2024-03-01"
}
```

**Response (201):**

```json
{
  "template": {
    "id": "uuid",
    "userId": "uuid",
    "ritualId": "uuid",
    "frequencyType": "daily",
    "frequencyData": {
      "daysOfWeek": [1, 2, 3, 4, 5]
    },
    "startDate": "2024-01-15",
    "endDate": "2024-03-01",
    "isActive": true
  },
  "scheduledDates": ["2024-01-15", "2024-01-16", "..."]
}
```

### PUT /daily-rituals/:id

Update a scheduled ritual (requires auth).

### DELETE /daily-rituals/:id

Remove a ritual from schedule (requires auth).

### POST /daily-rituals/:id/complete

Mark a daily ritual as completed (requires auth).

---

## 📊 Step Progress Endpoints

### PUT /daily-rituals/:id/steps/:stepId

Update step progress/answer (requires auth).

**Request Body:**

```json
{
  "completed": true,
  "answer": "I feel grateful for my health and family"
}
```

**For weightlifting steps:**

```json
{
  "completed": true,
  "answer": {
    "sets": [
      { "reps": 10, "weight": 135, "completed": true },
      { "reps": 8, "weight": 145, "completed": true },
      { "reps": 6, "weight": 155, "completed": false }
    ]
  }
}
```

**Response (200):**

```json
{
  "id": "uuid",
  "type": "qa",
  "name": "Gratitude",
  "completed": true,
  "answer": "I feel grateful for my health and family",
  "wasModified": false
}
```

---

## 📈 Metrics Endpoints

### GET /rituals/:id/metrics

Get metrics for a specific ritual (requires auth).

**Response (200):**

```json
{
  "completionHistory": [
    { "date": "2024-01-01", "completed": true, "completionRate": 100 },
    { "date": "2024-01-02", "completed": false, "completionRate": 0 }
  ],
  "totalCompletions": 42,
  "completionRate": 85.7,
  "currentStreak": 5,
  "longestStreak": 12,
  "averageCompletionTime": 8.5,
  "stepMetrics": {
    "step_uuid": {
      "completionHistory": [...],
      "totalCompletions": 40,
      "completionRate": 95.2,
      "currentStreak": 3,
      "longestStreak": 8
    }
  }
}
```

### GET /steps/:id/metrics

Get metrics for a specific step (requires auth).

### GET /users/me/stats

Get user's overall statistics (requires auth).

**Response (200):**

```json
{
  "currentStreak": 37,
  "longestStreak": 45,
  "proofScore": 1.45,
  "totalRituals": 8,
  "totalCompletions": 234,
  "averageCompletionRate": 87.3,
  "topCategories": [
    { "category": "Wellness", "completions": 145 },
    { "category": "Fitness", "completions": 89 }
  ]
}
```

---

## 🔍 Search & Discovery

### GET /search

Global search across user's rituals and public library.

**Query Parameters:**

- `q`: Search query
- `scope`: "private" | "public" | "all" (default: "all")
- `type`: "rituals" | "steps" | "all" (default: "rituals")

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": {
    "email": "Email is required"
  }
}
```

### 401 Unauthorized

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden

```json
{
  "error": "FORBIDDEN",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found

```json
{
  "error": "NOT_FOUND",
  "message": "Ritual not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```
