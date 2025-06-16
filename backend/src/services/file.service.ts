import { createError } from '../middlewares/errorHandler';
import { createFileMeta } from '../repository/filemeta.repo';
import { findFolderbyId } from '../repository/folder.repo';
import { SocketServer } from '../socket/socketServer';
import { JwtPayload } from './jwt-service';

interface uploadFileServicePropsType {
  file: Express.Multer.File;
  parentFolder?: string;
  user: JwtPayload;
  socketServer: SocketServer;
}
export async function uploadFileService({
  file,
  parentFolder,
  user,
  socketServer,
}: uploadFileServicePropsType) {
  // Validate parent folder if provided
  if (parentFolder) {
    const folder = await findFolderbyId(parentFolder);
    if (!folder || folder.owner.toString() !== user.id) {
      throw createError('Parent folder not found or not yours', 404);
    }
  }

  const fileMeta = await createFileMeta({
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadedBy: user.id as any,
    parentFolder: (parentFolder as any) || null,
  });

  // Emit real-time event

  if (socketServer) {
    // Emit to all connected users (or specific room)
    socketServer.io.emit('new-file-uploaded', {
      file: fileMeta,
      uploadedBy: {
        id: user.id,
        email: user.email,
      },
      parentFolder: parentFolder,
    });
  }

  return {
    success: true,
    message: 'File uploaded successfully',
    file: fileMeta,
  };
}
