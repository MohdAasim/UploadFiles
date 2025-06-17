import { createError } from '../middlewares/errorHandler';
import { getFileMetaByownerAndFolder } from '../repository/filemeta.repo';
import {
  createFolder,
  findFolderbyId,
  findFolderByOwner,
} from '../repository/folder.repo';
import logger from '../utils/logger';

/**
 * Create a new folder
 * @description Creates a new folder with proper path resolution and parent validation
 * @param {string} name - Name of the folder to create
 * @param {string} parent - Parent folder ID (optional, null for root)
 * @param {string} owner - Owner user ID
 * @returns {Promise<Object>} Folder creation result with folder data
 * @throws {Error} If parent folder is invalid or creation fails
 */
export async function addFolder(name: string, parent: string, owner: string) {
  logger.info(
    `Folder creation service initiated - Name: ${name}, Parent: ${
      parent || 'root'
    }, Owner: ${owner}`
  );

  // Find parent path or set as root
  let path = '/';
  if (parent) {
    logger.debug(`Validating parent folder: ${parent}`);
    const parentFolder = await findFolderbyId(parent);
    if (!parentFolder || parentFolder.owner.toString() !== owner) {
      logger.warn(
        `Invalid parent folder for creation - Folder: ${parent}, Owner: ${owner}`
      );
      throw createError('Parent folder not found or not yours', 404);
    }
    path = parentFolder.path + '' + parentFolder.name;
    logger.debug(`Parent folder validated - Path: ${path}`);
  }

  logger.debug(`Creating folder with path: ${path}`);
  const folder = await createFolder(name, parent, owner, path);

  logger.info(
    `Folder created successfully - ID: ${folder._id}, Name: ${name}, Path: ${path}`
  );

  return {
    success: true,
    message: 'Folder created successfully',
    data: folder,
  };
}

/**
 * Get folder tree structure
 * @description Retrieves folders and files within a specific parent folder
 * @param {string} owner - Owner user ID
 * @param {string | null} parent - Parent folder ID (null for root)
 * @returns {Promise<Object>} Folder tree data with folders and files
 */
export async function getFolderTree(owner: string, parent: string | null) {
  logger.info(
    `Folder tree service requested - Owner: ${owner}, Parent: ${
      parent || 'root'
    }`
  );

  // List folders in this parent
  logger.debug(`Fetching folders for parent: ${parent || 'root'}`);
  const folders = await findFolderByOwner(owner, parent);

  // List files in this folder (using parent folder id or null for root)
  logger.debug(`Fetching files for parent: ${parent || 'root'}`);
  const files = await getFileMetaByownerAndFolder(owner, parent);

  logger.info(
    `Folder tree retrieved - Folders: ${folders.length}, Files: ${files.length}, Parent: ${parent || 'root'}`
  );

  return {
    success: true,
    data: {
      folders,
      files,
    },
  };
}
