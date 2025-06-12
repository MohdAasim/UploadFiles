import mongoose, { Document, Schema } from 'mongoose';

export interface IFileMeta extends Document {
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  uploadedBy: mongoose.Types.ObjectId;
  parentFolder?: mongoose.Types.ObjectId | null; // Add support for folder structure
  createdAt: Date;
}

const FileMetaSchema = new Schema<IFileMeta>(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number, required: true },
    mimetype: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parentFolder: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model<IFileMeta>('FileMeta', FileMetaSchema);
