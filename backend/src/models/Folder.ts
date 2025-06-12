import mongoose, { Document, Schema } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  parent?: mongoose.Types.ObjectId | null;
  owner: mongoose.Types.ObjectId;
  path: string; 
  createdAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: { type: String, required: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    path: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model<IFolder>('Folder', FolderSchema);
