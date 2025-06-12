import { Router } from 'express';
import { createFolder, listFolderTree } from '../controllers/folderController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/create', authenticate, createFolder);
router.get('/tree', authenticate, listFolderTree);

export default router;
