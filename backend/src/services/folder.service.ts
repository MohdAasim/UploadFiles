import { createError } from '../middlewares/errorHandler';
import { getFileMetaByownerAndFolder } from '../repository/filemeta.repo';
import {
  createFolder,
  findFolderbyId,
  findFolderByOwner,
} from '../repository/folder.repo';

export async function addFolder(name: string, parent: string, owner: string) {
  // Find parent path or set as root
  let path = '/';
  if (parent) {
    const parentFolder = await findFolderbyId(parent);
    if (!parentFolder || parentFolder.owner.toString() !== owner) {
      throw createError('Parent folder not found or not yours', 404);
    }
    path = parentFolder.path + '' + parentFolder.name;
  }

  const folder = createFolder(name, parent, owner, path);
  return {
    success: true,
    message: 'Folder created successfully',
    folder,
  };
}

export async function getFolderTree(owner: string, parent: string | null) {
  // List folders in this parent
  const folders = await findFolderByOwner(owner, parent);

  // List files in this folder (using parent folder id or null for root)

  const files = await getFileMetaByownerAndFolder(owner, parent);

  return {
    success: true,
    data: {
      folders,
      files,
    },
  };
}
