import mongoose, { Document, Schema } from 'mongoose';

export interface IFileVersion {
  versionNumber: number;
  filename: string;
  path: string;
  uploadedAt: Date;
  uploadedBy: mongoose.Types.ObjectId;
  remark?: string;
}

export interface IFileMeta extends Document {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedBy: mongoose.Types.ObjectId;
  parentFolder?: mongoose.Types.ObjectId | null;
  sharedWith: Array<{
    user: mongoose.Types.ObjectId;
    permission: 'view' | 'edit' | 'admin';
  }>;
  versions: IFileVersion[];
  createdAt: Date;
}

const FileVersionSchema = new Schema<IFileVersion>(
  {
    versionNumber: { type: Number, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    remark: { type: String },
  },
  { _id: false }
);

const FileMetaSchema = new Schema<IFileMeta>(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mimetype: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentFolder: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    sharedWith: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        permission: {
          type: String,
          enum: ['view', 'edit', 'admin'],
          default: 'view',
        },
      },
    ],
    versions: [FileVersionSchema],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model<IFileMeta>('FileMeta', FileMetaSchema);
