import { Request, Response, NextFunction } from 'express';
import FileMeta from '../models/FileMeta';
import Folder from '../models/Folder';
import { createError } from './errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

type Permission = 'view' | 'edit' | 'admin';

export const checkPermission =
  (resourceType: 'file' | 'folder', required: Permission) =>
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const resourceId = req.params.id || req.body.resourceId;
      const userId = req.user?.id;

      if (!userId) {
        res
          .status(401)
          .json({ success: false, message: 'User not authenticated' });
        return;
      }

      let resource: any;
      if (resourceType === 'file') {
        resource = await FileMeta.findById(resourceId);
      } else {
        resource = await Folder.findById(resourceId);
      }

      if (!resource) {
        res.status(404).json({ success: false, message: 'Resource not found' });
        return;
      }

      // Owner always has full permission
      const isOwner =
        resourceType === 'file'
          ? resource.uploadedBy.toString() === userId
          : resource.owner.toString() === userId;

      if (isOwner) {
        return next();
      }

      // Find user's permission
      const shared = resource.sharedWith.find(
        (entry: any) => entry.user.toString() === userId,
      );

      if (!shared) {
        res
          .status(403)
          .json({ success: false, message: 'No permission for this resource' });
        return;
      }

      // Permission hierarchy with type safety
      const levels: Record<Permission, number> = { view: 1, edit: 2, admin: 3 };
      const userPermission = shared.permission as Permission;

      // Validate that the permission is valid
      if (!Object.keys(levels).includes(userPermission)) {
        res
          .status(403)
          .json({ success: false, message: 'Invalid permission type' });
        return;
      }

      if (levels[userPermission] < levels[required]) {
        res
          .status(403)
          .json({ success: false, message: 'Insufficient permission' });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
