import FileMeta from '../models/FileMeta';

export async function getFileMetaByownerAndFolder(
  uploadedBy: string,
  parentFolder: string | null,
) {
  return await FileMeta.find({ uploadedBy, parentFolder });
}
