import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { searchFilesAndFolders } from '../controllers/searchController';

const router = Router();

// Search files and folders
router.get('/', authenticate, searchFilesAndFolders);

export default router;
