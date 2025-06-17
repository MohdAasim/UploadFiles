import { Router } from 'express';
import {
  uploadFile,
  listFiles,
  previewFile,
  deleteFile,
} from '../controllers/fileController';
import { authenticate } from '../middlewares/auth';
import upload from '../middlewares/upload';

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.get('/', authenticate, listFiles);
router.get('/preview/:id', authenticate, previewFile);
router.delete('/:id', authenticate, deleteFile); // Make sure this route exists

export default router;
