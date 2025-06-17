import { Router } from 'express';
import {
  createFolder,
  listFolderTree,
  getAllFolders,
  deleteFolder,
  updateFolder,
} from '../controllers/folderController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/create', authenticate, createFolder);
router.get('/tree', authenticate, listFolderTree);
router.get('/all', authenticate, getAllFolders);
router.delete('/:id', authenticate, deleteFolder);
router.put('/:id', authenticate, updateFolder);
export default router;
