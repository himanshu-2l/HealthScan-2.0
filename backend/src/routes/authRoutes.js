import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const isDemoAuthEnabled = () => process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEMO_AUTH === 'true';

// Seed demo users only when non-production and explicit ENABLE_DEMO_AUTH=true
const createDemoUsersMap = () => {
  if (!isDemoAuthEnabled()) {
    return new Map();
  }
  return new Map([
    [
      'alex.mercer@healthscan.io',
      {
        uid: 'demo-user-healthscan',
        email: 'alex.mercer@healthscan.io',
        name: 'Dr. Alex Mercer',
        role: 'doctor',
        passwordHash: bcrypt.hashSync('Password123!', 10),
        createdAt: new Date().toISOString()
      }
    ],
    [
      'alex.rivera@abdm',
      {
        uid: 'demo-patient-healthscan',
        email: 'alex.rivera@abdm',
        name: 'Alex Rivera',
        role: 'patient',
        passwordHash: bcrypt.hashSync('Password123!', 10),
        createdAt: new Date().toISOString()
      }
    ]
  ]);
};

const inMemoryUsers = createDemoUsersMap();

const isMongoConnected = () => mongoose.connection.readyState === 1;

const registerSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().trim().email({ message: 'A valid email address is required' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' })
});

/**
 * POST /api/auth/register
 * Register a new user with name, email, password (role is always assigned as 'patient')
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'Invalid registration details';
      return res.status(400).json({ error: firstError });
    }

    const { name, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase();
    // Ignore role from the request body. Always assign patient.
    const userRole = 'patient';

    // 1. If MongoDB is connected, use Mongoose model
    if (isMongoConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: userRole
      });

      await newUser.save();

      const userPayload = {
        uid: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      };

      const token = generateToken(userPayload, '7d');

      return res.status(201).json({
        message: 'Account created successfully',
        token,
        user: userPayload
      });
    }

    // In production, return 503 when MongoDB is disconnected instead of using in-memory store
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database service is unavailable'
      });
    }

    // 2. In-memory fallback (development/testing only)
    if (inMemoryUsers.has(normalizedEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const uid = 'user-' + Date.now();

    const createdUser = {
      uid,
      name: name.trim(),
      email: normalizedEmail,
      role: userRole,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    inMemoryUsers.set(normalizedEmail, createdUser);

    const userPayload = {
      uid,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role
    };

    const token = generateToken(userPayload, '7d');

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email & password
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. If MongoDB is connected
    if (isMongoConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const userPayload = {
        uid: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      };

      const token = generateToken(userPayload, '7d');

      return res.json({
        message: 'Signed in successfully',
        token,
        user: userPayload
      });
    }

    // In production, return 503 when MongoDB is disconnected instead of using in-memory store
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database service is unavailable'
      });
    }

    // 2. In-memory fallback (development/testing only)
    const user = inMemoryUsers.get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userPayload = {
      uid: user.uid,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = generateToken(userPayload, '7d');

    return res.json({
      message: 'Signed in successfully',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * GET /api/auth/me
 * Retrieve currently authenticated user profile
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

export default router;
