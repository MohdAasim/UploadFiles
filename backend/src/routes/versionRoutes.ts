import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { checkPermission } from '../middlewares/permission';
import upload from '../middlewares/upload';
import {
  uploadNewVersion,
  getVersionHistory,
  restoreVersion,
} from '../controllers/versionController';

const router = Router();

// Upload new version (requires edit permission)
router.post(
  '/upload/:id',
  authenticate,
  checkPermission('file', 'edit'),
  upload.single('file'),
  uploadNewVersion
);

// View version history (requires view permission)
router.get(
  '/history/:id',
  authenticate,
  checkPermission('file', 'view'),
  getVersionHistory
);

// Restore version (requires admin permission)
router.post(
  '/restore/:id',
  authenticate,
  checkPermission('file', 'admin'),
  restoreVersion
);

export default router;
