import Folder from '../models/Folder';

export async function findFolderbyId(id: string) {
  return await Folder.findById(id);
}

export async function createFolder(
  name: string,
  parent: string,
  owner: string,
  path: string
) {
  return await Folder.create({
    name,
    parent: parent || null,
    owner,
    path,
  });
}
export async function findFolderByOwner(owner: string, parent: string | null) {
  return await Folder.find({ owner, parent: parent || null });
}

export async function getFoldersByUserId(id: string) {
  return await Folder.find({
    'sharedWith.user': id,
  }).populate('owner', 'name email');
}

export async function getSharedFoldersByUserId(id: string) {
  return await Folder.find({
    owner: id,
    'sharedWith.0': { $exists: true }, // Has at least one shared entry
  }).populate('sharedWith.user', 'name email');
}
