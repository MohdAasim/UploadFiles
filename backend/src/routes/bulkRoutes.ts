import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { bulkAction } from '../controllers/bulkController';

const router = Router();

// Bulk operations (delete, move, copy, download)
router.post('/', authenticate, bulkAction);
// body{
//     "action": "download",
//     "files": ["64f1a2b3c4d5e6f7g8h9i0j1"],
//     "folders": ["64f1a2b3c4d5e6f7g8h9i0j2"]
//   }

export default router;
