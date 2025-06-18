import { createError } from '../middlewares/errorHandler';
import { createFileMeta } from '../repository/filemeta.repo';
import { findFolderbyId } from '../repository/folder.repo';
import { SocketServer } from '../socket/socketServer';
import { JwtPayload } from './jwt-service';
import logger from '../utils/logger';

interface uploadFileServicePropsType {
  file: Express.Multer.File;
  parentFolder?: string;
  user: JwtPayload;
  socketServer?: SocketServer;
}

/**
 * Upload file service
 * @description Handles file upload with validation, metadata creation, and real-time notifications
 * @param {Object} uploadData - File upload data
 * @param {Express.Multer.File} uploadData.file - Uploaded file object from multer
 * @param {string} [uploadData.parentFolder] - Optional parent folder ID
 * @param {JwtPayload} uploadData.user - Authenticated user data
 * @param {SocketServer} [uploadData.socketServer] - Socket server for real-time notifications
 * @returns {Promise<Object>} Upload result with file metadata
 * @throws {Error} If parent folder is invalid or upload fails
 */
export async function uploadFileService({
  file,
  parentFolder,
  user,
  socketServer,
}: uploadFileServicePropsType) {
  logger.info(
    `File upload service initiated - File: ${file.originalname}, User: ${user.id}, Parent: ${parentFolder || 'root'}`
  );

  // Validate parent folder if provided
  if (parentFolder) {
    logger.debug(`Validating parent folder: ${parentFolder}`);
    const folder = await findFolderbyId(parentFolder);
    if (!folder || folder.owner.toString() !== user.id) {
      logger.warn(
        `Invalid parent folder for upload - Folder: ${parentFolder}, User: ${user.id}`
      );
      throw createError('Parent folder not found or not yours', 404);
    }
    logger.debug(`Parent folder validated successfully: ${folder.name}`);
  }

  logger.debug(`Creating file metadata for: ${file.originalname}`);
  const fileMeta = await createFileMeta({
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadedBy: user.id as any,
    parentFolder: (parentFolder as any) || null,
  });

  logger.info(
    `File metadata created successfully - ID: ${fileMeta._id}, Size: ${file.size} bytes`
  );

  // Emit real-time event
  if (socketServer) {
    logger.debug(
      `Emitting real-time upload notification for file: ${file.originalname}`
    );
    // Emit to all connected users (or specific room)
    socketServer.io.emit('new-file-uploaded', {
      file: fileMeta,
      uploadedBy: {
        id: user.id,
        email: user.email,
      },
      parentFolder: parentFolder,
    });
    logger.debug(
      `Real-time notification sent for file upload: ${file.originalname}`
    );
  }

  logger.info(
    `File upload service completed successfully - File: ${file.originalname}, ID: ${fileMeta._id}`
  );

  return {
    success: true,
    message: 'File uploaded successfully',
    file: fileMeta,
  };
}
