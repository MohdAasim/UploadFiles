import { Router } from 'express';
import {
  uploadFile,
  listFiles,
  previewFile,
} from '../controllers/fileController';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';
import upload from '../middlewares/upload';

const router = Router();

// Public routes (no permission check needed)
router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.get('/', authenticate, listFiles);

// Protected routes with permission checks
router.get(
  '/preview/:id',
  authenticate,
  checkPermission('file', 'view'),
  previewFile,
);

export default router;
