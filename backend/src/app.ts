import express, { Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import fileRoutes from './routes/fileRoutes';
import folderRoutes from './routes/folderRoutes';
import { globalErrorHandler } from './middlewares/errorHandler';
import connectDB from './config/db'; // Fixed: was './confg/db'

// Load environment variables
dotenv.config({ path: '.env.dev' });

// Connect to database
connectDB();

const app = express();
const port = process.env.PORT || 3000;
const message = process.env.MESSAGE || 'Hello, TypeScript + Express!';

// Middleware
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.send(message);
});

// Auth routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/folders', folderRoutes); 

// 404 handler for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler (must be last middleware)
app.use(globalErrorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
