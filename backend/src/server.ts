// Load environment variables FIRST — must be before any other import that reads process.env
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import rsvpRoutes from './routes/rsvps';
import notificationRoutes from './routes/notifications';
import courtRoutes from './routes/courts';
import userRoutes from './routes/users';
import guestRoutes from './routes/guests';
import setRoutes from './routes/sets';
import adminRoutes from './routes/admin';
import ratingRoutes from './routes/ratings';
import watchRoutes from './routes/watch';
import matchRoutes from './routes/matches';
import groupRoutes from './routes/groups';
import superAdminRoutes from './routes/superadmin';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
// Allow both localhost and local network access for mobile testing (dev only)
const allowedOrigins = [corsOrigin];
// In development, also allow local network access for mobile testing
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://192.168.2.21:5173');
}
console.log(`🌐 CORS enabled for origins:`, allowedOrigins);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Padel Coordinator API is running!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/rsvps', rsvpRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/sets', setRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/watch', watchRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/superadmin', superAdminRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
  console.log(`👤 User endpoints: http://localhost:${PORT}/api/users`);
  console.log(`🎾 Session endpoints: http://localhost:${PORT}/api/sessions`);
  console.log(`✅ RSVP endpoints: http://localhost:${PORT}/api/rsvps`);
  console.log(`🔔 Notification endpoints: http://localhost:${PORT}/api/notifications`);
  console.log(`🏟️ Court endpoints: http://localhost:${PORT}/api/courts`);
    console.log(`👥 Guest endpoints: http://localhost:${PORT}/api/guests`);
    console.log(`🎾 Set endpoints: http://localhost:${PORT}/api/sets`);
    console.log(`⭐ Rating endpoints: http://localhost:${PORT}/api/ratings`);
    console.log(`⌚ Watch endpoints: http://localhost:${PORT}/api/watch`);
    console.log(`🎯 Match endpoints: http://localhost:${PORT}/api/matches`);
});

