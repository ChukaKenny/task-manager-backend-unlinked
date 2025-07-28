# Task Manager API Documentation

## Overview
This API allows you to manage tasks in a simple task management system. You can create, read, update, and delete tasks after authenticating with your user account.

## Quick Start Guide

1. **Base URL**: All requests start with
   ```
   http://localhost:5000/api
   ```

2. **Authentication**: 
   - First, login to get your token
   - Then include it in all other requests:
   ```
   Authorization: Bearer <your_token>
   ```

3. **Response Format**: All responses follow this structure:
   ```json
   {
     "success": true/false,
     "message": "A human-readable message",
     "data": {
       // The actual data you requested
     }
   }
   ```

## Detailed Endpoints Guide

### 1. Check if API is Working

```http
GET /health
```

Just to check if the API is up and running.

**Expected Status Codes:**
- 200: API is running properly
- 503: Service unavailable (server is down)

**Expected Response Time:**
- Maximum: 200ms
- Average: < 100ms

**Sample Response:**
```json
{
  "success": true,
  "message": "Task Manager API is running",
  "timestamp": "2025-07-26T17:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. User Login

```http
POST /login
```

Log in to get your authentication token.

**Expected Status Codes:**
- 200: Successful login
- 401: Invalid credentials
- 400: Missing or invalid request body
- 429: Too many login attempts (rate limiting)

**Expected Response Time:**
- Maximum: 500ms (including token generation)
- Average: < 300ms
- Slow threshold: > 1s (investigate if occurs)

**Sample Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Sample Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@taskmanager.com"
    }
  }
}
```

**Available Test Accounts:**
| Username | Password  | Description |
|----------|-----------|-------------|
| admin    | password123 | Admin user with full access |
| testuser | test123    | Regular test user |
| demo     | demo       | Demo account |

### 3. Managing Tasks

#### A. Get Your Tasks

```http
GET /items
```

Gets all your tasks with optional filtering.

**Expected Status Codes:**
- 200: Successfully retrieved tasks
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 400: Invalid query parameters
- 404: No tasks found (optional, some implementations return 200 with empty array)

**Expected Response Time:**
- Maximum: 1s (for full list)
- Average: < 500ms
- With filters: < 300ms
- With pagination: < 200ms per page
- Slow threshold: > 2s (investigate if occurs)

**Query Parameters Examples:**
```
/items?priority=high            // Get only high priority tasks
/items?completed=true          // Get completed tasks
/items?search=meeting          // Search for tasks with "meeting"
/items?page=2&limit=5         // Get second page, 5 items per page
```

**Sample Response:**
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": {
    "tasks": [
      {
        "id": 1,
        "title": "Prepare QA Test Plan",
        "description": "Create comprehensive test cases for API endpoints",
        "priority": "high",
        "completed": false,
        "createdAt": "2025-07-26T17:00:00.000Z",
        "updatedAt": "2025-07-26T17:00:00.000Z"
      },
      {
        "id": 2,
        "title": "Team Meeting",
        "description": "Weekly sync-up with development team",
        "priority": "medium",
        "completed": true,
        "createdAt": "2025-07-26T16:00:00.000Z",
        "updatedAt": "2025-07-26T17:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

#### B. Create a New Task

```http
POST /items
```

**Expected Status Codes:**
- 201: Task created successfully
- 400: Invalid request body or validation error
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 429: Too many requests (rate limiting)

**Expected Response Time:**
- Maximum: 500ms
- Average: < 300ms
- With large description: < 400ms
- Slow threshold: > 1s (investigate if occurs)

**Sample Request:**
```json
{
  "title": "Review Pull Request",
  "description": "Review and test new feature implementation",
  "priority": "high"
}
```

**Validation Rules:**
- Title: Required, max 200 characters
- Description: Optional, max 1000 characters
- Priority: Must be "low", "medium", or "high"

**Sample Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "id": 3,
      "title": "Review Pull Request",
      "description": "Review and test new feature implementation",
      "priority": "high",
      "completed": false,
      "createdAt": "2025-07-26T18:00:00.000Z",
      "updatedAt": "2025-07-26T18:00:00.000Z"
    }
  }
}
```

#### C. Update a Task

```http
PUT /items/:id
```

**Expected Status Codes:**
- 200: Task updated successfully
- 400: Invalid request body or validation error
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (not task owner)
- 404: Task not found
- 409: Conflict (task already updated by another user)
- 429: Too many requests (rate limiting)

**Expected Response Time:**
- Maximum: 500ms
- Average: < 300ms
- With large description: < 400ms
- Concurrent updates: < 600ms
- Slow threshold: > 1s (investigate if occurs)

**Sample Request to /items/3:**
```json
{
  "title": "Review Pull Request #123",
  "description": "Review and test new feature implementation - API endpoints",
  "priority": "medium",
  "completed": true
}
```

**Sample Response:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": {
      "id": 3,
      "title": "Review Pull Request #123",
      "description": "Review and test new feature implementation - API endpoints",
      "priority": "medium",
      "completed": true,
      "createdAt": "2025-07-26T18:00:00.000Z",
      "updatedAt": "2025-07-26T18:30:00.000Z"
    }
  }
}
```

#### D. Delete a Task

```http
DELETE /items/:id
```

**Expected Status Codes:**
- 200: Task deleted successfully
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (not task owner)
- 404: Task not found
- 409: Conflict (task already deleted)
- 429: Too many requests (rate limiting)

**Expected Response Time:**
- Maximum: 500ms
- Average: < 200ms
- Batch deletes: < 1s
- Slow threshold: > 800ms (investigate if occurs)

**Sample Response when deleting /items/3:**
```json
{
  "success": true,
  "message": "Task deleted successfully",
  "data": {
    "task": {
      "id": 3,
      "title": "Review Pull Request #123",
      "description": "Review and test new feature implementation - API endpoints",
      "priority": "medium",
      "completed": true
    }
  }
}
```

## Common Error Responses

### 1. Invalid Login
```json
{
  "success": false,
  "error": "AUTHENTICATION_FAILED",
  "message": "Invalid username or password"
}
```

### 2. Missing Token
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Access token is required"
}
```

### 3. Invalid Task Data
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": {
    "title": "Title cannot be empty",
    "priority": "Priority must be one of: low, medium, high"
  }
}
```

### 4. Task Not Found
```json
{
  "success": false,
  "error": "TASK_NOT_FOUND",
  "message": "Task not found"
}
```
```

## Error Code Reference

| Code | Description | Example Scenario |
|------|-------------|------------------|
| UNAUTHORIZED | Missing/invalid token | Trying to get tasks without logging in |
| FORBIDDEN | No permission | Trying to delete another user's task |
| VALIDATION_ERROR | Invalid input | Creating task without title |
| TASK_NOT_FOUND | Task doesn't exist | Updating deleted task |
| INTERNAL_SERVER_ERROR | Server error | Database connection failed |
| ENDPOINT_NOT_FOUND | Invalid URL | Accessing wrong endpoint |

## Technical Notes

### CORS Support
- Development: All origins allowed
- Production: Configure allowed origins

### Data Persistence
- Current: In-memory storage (data resets when server restarts)
- Production: Implement database storage

### Security
- JWT tokens expire after 24 hours
- Passwords are hashed using bcrypt
- HTTPS recommended for production

## API Testing Guide

### Manual Testing with cURL

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Test the health endpoint:**
   ```bash
   curl http://localhost:5000/api/health
   ```

3. **Login and get token:**
   ```bash
   curl -X POST http://localhost:5000/api/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "password123"}'
   ```

4. **Create a task (using token):**
   ```bash
   curl -X POST http://localhost:5000/api/items \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Task", "priority": "high"}'
   ```

### Automated Testing Guide

This section provides examples for automating API tests using different tools.

#### 1. Using Supertest (Node.js)

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Task Manager API Tests', () => {
  let authToken;
  
  // Login Test Cases
  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'password123'
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      authToken = res.body.data.token;
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'wrongpass'
        })
        .expect(401);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('AUTHENTICATION_FAILED');
    });
  });

  // Task Management Test Cases
  describe('Task CRUD Operations', () => {
    let taskId;

    // GET /items tests
    it('should get all tasks for authenticated user', async () => {
      const res = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
    });

    // POST /items tests
    it('should create a new task with valid data', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Testing task creation',
          priority: 'high'
        })
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.title).toBe('Test Task');
      taskId = res.body.data.task.id;
    });

    it('should fail to create task with invalid data', async () => {
      const res = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing title',
          priority: 'invalid'
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    // PUT /items/:id tests
    it('should update task successfully', async () => {
      const res = await request(app)
        .put(`/api/items/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Task',
          completed: true
        })
        .expect(200);
      
      expect(res.body.data.task.title).toBe('Updated Task');
      expect(res.body.data.task.completed).toBe(true);
    });

    // DELETE /items/:id tests
    it('should delete task successfully', async () => {
      await request(app)
        .delete(`/api/items/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
```

#### 2. Using Postman/Newman

```json
{
  "info": {
    "name": "Task Manager API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login Success",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Status code is 200', function() {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "pm.test('Has valid token', function() {",
                  "    const response = pm.response.json();",
                  "    pm.expect(response.data.token).to.be.a('string');",
                  "    pm.environment.set('authToken', response.data.token);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/login",
            "body": {
              "mode": "raw",
              "raw": "{\"username\": \"admin\", \"password\": \"password123\"}",
              "options": { "raw": { "language": "json" } }
            }
          }
        }
      ]
    },
    {
      "name": "Tasks",
      "item": [
        {
          "name": "Get All Tasks",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/items",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ]
          }
        },
        {
          "name": "Create Task",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/items",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\"title\": \"New Task\", \"priority\": \"high\"}",
              "options": { "raw": { "language": "json" } }
            }
          }
        }
      ]
    }
  ]
}
```

### Test Cases Coverage

For each endpoint, test the following scenarios:

#### POST /login
- ✅ Successful login with valid credentials
- ❌ Failed login with invalid password
- ❌ Failed login with non-existent user
- ❌ Failed login with missing fields

#### GET /items
- ✅ Get all tasks successfully
- ✅ Filter tasks by priority
- ✅ Search tasks by keyword
- ✅ Pagination works correctly
- ❌ Access denied without token
- ❌ Access with expired token

#### POST /items
- ✅ Create task with all fields
- ✅ Create task with required fields only
- ❌ Create without title
- ❌ Create with invalid priority
- ❌ Create with invalid token
- ❌ Create with missing token

#### PUT /items/:id
- ✅ Update all fields
- ✅ Partial update
- ✅ Toggle completion status
- ❌ Update non-existent task
- ❌ Update with invalid data
- ❌ Update without permission

#### DELETE /items/:id
- ✅ Delete existing task
- ❌ Delete already deleted task
- ❌ Delete non-existent task
- ❌ Delete without permission
- ❌ Delete with invalid token

### Running the Tests

1. **Install Dependencies:**
   ```bash
   npm install --save-dev jest supertest
   ```

2. **Configure Test Environment:**
   ```json
   {
     "scripts": {
       "test": "jest --forceExit --detectOpenHandles",
       "test:watch": "jest --watch"
     }
   }
   ```

3. **Run Tests:**
   ```bash
   npm test
   ```
