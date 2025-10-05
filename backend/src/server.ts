import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import rsvpRoutes from './routes/rsvps';
import notificationRoutes from './routes/notifications';
import courtRoutes from './routes/courts';
import userRoutes from './routes/users';
import guestRoutes from './routes/guests';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
console.log(`🌐 CORS enabled for origin: ${corsOrigin}`);
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
});

