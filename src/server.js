// backend/src/server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replace with database in production)
const users = {
  'admin': {
    id: 1,
    username: 'admin',
    password: '$2a$10$8K1p/a0drt..vBQ2xhcfAO0GWK5WLlxKUyJvFhZn8XA6E4.xb9K8a', // password123
    email: 'admin@taskmanager.com'
  },
  'testuser': {
    id: 2,
    username: 'testuser',
    password: '$2a$10$TKh2H1.PFWmWoSDwg8RHaOd6j2sVPQOjFSYt5YYLjCgq5YQxAV0Ne', // test123
    email: 'test@taskmanager.com'
  },
  'demo': {
    id: 3,
    username: 'demo',
    password: '$2a$10$Y7mWiT4FHSqnmvgAV0g2vuLgT3HLZjgN4H.jNfDzqY5c2ZxXsJ8Lq', // demo
    email: 'demo@taskmanager.com'
  }
};

// Sample tasks data
let tasks = [
  {
    id: 1,
    title: 'Complete QA Challenge',
    description: 'Implement Playwright and Postman tests',
    priority: 'high',
    completed: false,
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Review Test Cases',
    description: 'Go through all test scenarios',
    priority: 'medium',
    completed: true,
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Update Documentation',
    description: 'Write comprehensive test plan',
    priority: 'low',
    completed: false,
    userId: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper function to generate next ID
const getNextId = () => {
  return tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Access token is required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

// Validation middleware
const validateLoginInput = (req, res, next) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Username and password are required',
      details: {
        username: !username ? 'Username is required' : null,
        password: !password ? 'Password is required' : null
      }
    });
  }
  
  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Username must be at least 3 characters long'
    });
  }
  
  next();
};

const validateTaskInput = (req, res, next) => {
  const { title, description, priority } = req.body;
  const validPriorities = ['low', 'medium', 'high'];
  
  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Task title is required',
      details: {
        title: 'Title cannot be empty'
      }
    });
  }
  
  if (title.length > 200) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Task title is too long',
      details: {
        title: 'Title must be less than 200 characters'
      }
    });
  }
  
  if (description && description.length > 1000) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Task description is too long',
      details: {
        description: 'Description must be less than 1000 characters'
      }
    });
  }
  
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid priority value',
      details: {
        priority: `Priority must be one of: ${validPriorities.join(', ')}`
      }
    });
  }
  
  next();
};

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Task Manager API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// POST /api/login - User authentication
app.post('/api/login', validateLoginInput, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = users[username];
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_FAILED',
        message: 'Invalid username or password'
      });
    }
    
    // For demo purposes, also accept plain text passwords
    const isValidPassword = await bcrypt.compare(password, user.password) || 
                           (user.username === 'admin' && password === 'password123') ||
                           (user.username === 'testuser' && password === 'test123') ||
                           (user.username === 'demo' && password === 'demo');
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_FAILED',
        message: 'Invalid username or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred during login'
    });
  }
});

// GET /api/items - Get all tasks for authenticated user
app.get('/api/items', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, priority, completed, search } = req.query;
    
    // Filter tasks by user
    let userTasks = tasks.filter(task => task.userId === req.user.id);
    
    // Apply filters
    if (priority) {
      userTasks = userTasks.filter(task => task.priority === priority);
    }
    
    if (completed !== undefined) {
      const isCompleted = completed === 'true';
      userTasks = userTasks.filter(task => task.completed === isCompleted);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      userTasks = userTasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTasks = userTasks.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: {
        tasks: paginatedTasks,
        pagination: {
          total: userTasks.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(userTasks.length / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while retrieving tasks'
    });
  }
});

// POST /api/items - Create new task
app.post('/api/items', authenticateToken, validateTaskInput, (req, res) => {
  try {
    const { title, description = '', priority = 'medium' } = req.body;
    
    const newTask = {
      id: getNextId(),
      title: title.trim(),
      description: description.trim(),
      priority,
      completed: false,
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: newTask
      }
    });
    
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while creating the task'
    });
  }
});

// PUT /api/items/:id - Update existing task
app.put('/api/items/:id', authenticateToken, validateTaskInput, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, priority, completed } = req.body;
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid task ID format'
      });
    }
    
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'TASK_NOT_FOUND',
        message: 'Task not found'
      });
    }
    
    const task = tasks[taskIndex];
    
    // Check if user owns the task
    if (task.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You can only update your own tasks'
      });
    }
    
    // Update task
    const updatedTask = {
      ...task,
      title: title ? title.trim() : task.title,
      description: description !== undefined ? description.trim() : task.description,
      priority: priority || task.priority,
      completed: completed !== undefined ? completed : task.completed,
      updatedAt: new Date().toISOString()
    };
    
    tasks[taskIndex] = updatedTask;
    
    res.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        task: updatedTask
      }
    });
    
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while updating the task'
    });
  }
});

// DELETE /api/items/:id - Delete task
app.delete('/api/items/:id', authenticateToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid task ID format'
      });
    }
    
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'TASK_NOT_FOUND',
        message: 'Task not found'
      });
    }
    
    const task = tasks[taskIndex];
    
    // Check if user owns the task
    if (task.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You can only delete your own tasks'
      });
    }
    
    // Remove task
    const deletedTask = tasks.splice(taskIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: {
        task: deletedTask
      }
    });
    
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while deleting the task'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'ENDPOINT_NOT_FOUND',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Task Manager API Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 API Base URL: http://localhost:${PORT}/api`);
  console.log('\n📋 Available Endpoints:');
  console.log('  POST   /api/login');
  console.log('  GET    /api/items');
  console.log('  POST   /api/items');
  console.log('  PUT    /api/items/:id');
  console.log('  DELETE /api/items/:id');
  console.log('\n🔐 Demo Credentials:');
  console.log('  admin / password123');
  console.log('  testuser / test123');
  console.log('  demo / demo');
});

module.exports = app;