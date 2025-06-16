import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  shareResource,
  getFilePermissions,
  getFolderPermissions,
  getSharedWithMe,
  getMySharedResources,
  removePermission,
} from '../controllers/shareController';

const router = Router();

// Share a resource
router.post('/', authenticate, shareResource);

// Get who has access to specific resources
router.get('/file/:fileId/permissions', authenticate, getFilePermissions);
router.get('/folder/:folderId/permissions', authenticate, getFolderPermissions);

// Get shared resources
router.get('/shared-with-me', authenticate, getSharedWithMe);
router.get('/my-shared', authenticate, getMySharedResources);

// Remove permission
router.delete('/permission', authenticate, removePermission);

export default router;
