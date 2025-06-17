import mongoose from 'mongoose';
import FileMeta, { IFileVersion } from '../models/FileMeta';
interface createFileMetaPropsType {
  originalName?: string;
  filename?: string;
  path?: string;
  size?: number;
  mimetype?: string;
  uploadedBy?: mongoose.Types.ObjectId;
  parentFolder?: mongoose.Types.ObjectId | null;
  sharedWith?: Array<{
    user?: mongoose.Types.ObjectId;
    permission?: 'view' | 'edit' | 'admin';
  }>;
  versions?: IFileVersion[];
  createdAt?: Date;
}

export async function getFileMetaByownerAndFolder(
  uploadedBy: string,
  parentFolder: string | null
) {
  return await FileMeta.find({ uploadedBy, parentFolder }).sort({
    createdAt: -1,
  });
}

export async function getFileMetaById(id: string) {
  return await FileMeta.findById(id);
}

export async function getFilesByUserID(id: string) {
  return await FileMeta.find({
    'sharedWith.user': id,
  }).populate('uploadedBy', 'name email');
}

export async function getSharedFilesByUserID(id: string) {
  return await FileMeta.find({
    uploadedBy: id,
    'sharedWith.0': { $exists: true }, // Has at least one shared entry
  }).populate('sharedWith.user', 'name email');
}

export async function getFileMetaByFileId(id: string) {
  return await FileMeta.findById(id).populate('sharedWith.user', 'name email');
}

export async function getFileVersoinHistoryByFileId(id: string) {
  return await FileMeta.findById(id).populate(
    'versions.uploadedBy',
    'name email'
  );
}

export async function createFileMeta(filemetadata: createFileMetaPropsType) {
  return await FileMeta.create(filemetadata);
}
