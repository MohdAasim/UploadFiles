import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import * as dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import fileRoutes from './routes/fileRoutes';
import folderRoutes from './routes/folderRoutes';
import shareRoutes from './routes/shareRoutes';
import versionRoutes from './routes/versionRoutes';
import bulkRoutes from './routes/bulkRoutes';
import realtimeRoutes from './routes/realtimeRoutes';
import searchRoutes from './routes/searchRoutes';
import { globalErrorHandler } from './middlewares/errorHandler';
import connectDB from './config/db';
import { SocketServer } from './socket/socketServer';

// Load environment variables
dotenv.config({ path: '.env.dev' });

// Connect to database
connectDB();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 5000;
const message =
  process.env.MESSAGE || 'Hello, TypeScript + Express with Socket.IO!';

// Initialize Socket.IO server
const socketServer = new SocketServer(httpServer);

// Make socket server available to routes
app.set('socketServer', socketServer);

// Middleware
app.use(express.json());

// Enable CORS with origin from environment variable
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send(message);
});

// Auth routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/folders', folderRoutes);
app.use('/api/v1/share', shareRoutes);
app.use('/api/v1/versions', versionRoutes);
app.use('/api/v1/bulk', bulkRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/realtime', realtimeRoutes);

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last middleware)
app.use(globalErrorHandler);

// Start server
httpServer.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Socket.IO server initialized`);
});
