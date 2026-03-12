import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import accountRoutes from './routes/accounts';
import contactRoutes from './routes/contacts';
import leadRoutes from './routes/leads';
import opportunityRoutes from './routes/opportunities';
import taskRoutes from './routes/tasks';
import activityRoutes from './routes/activities';
import notificationRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import agentRoutes from './routes/agents';
import campaignRoutes from './routes/campaigns';
import validationRoutes from './routes/validation';

const app = express();

// CORS
const allowedOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigins.split(','),
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/validation', validationRoutes);

// In production, serve the React client build
const clientBuildPath = path.join(__dirname, '../../client/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientBuildPath));
  // SPA fallback — any non-API route serves index.html
  app.get('*', (_req, res, next) => {
    if (_req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handler (must be last)
app.use(errorHandler);

export default app;
