import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { 
  getOnlineUsers, 
  getFileEditingStatus,
  notifyUser
} from '../controllers/realtimeController';

const router = Router();

router.get('/online-users', authenticate, getOnlineUsers);
router.get('/file-status/:fileId', authenticate, getFileEditingStatus);
router.post('/notify', authenticate, notifyUser);

export default router;