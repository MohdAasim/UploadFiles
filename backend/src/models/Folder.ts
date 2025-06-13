import mongoose, { Document, Schema } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  parent?: mongoose.Types.ObjectId | null;
  owner: mongoose.Types.ObjectId;
  path: string;
  sharedWith: Array<{
    user: mongoose.Types.ObjectId;
    permission: 'view' | 'edit' | 'admin';
  }>;
  createdAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: { type: String, required: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    path: { type: String, required: true },
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
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export default mongoose.model<IFolder>('Folder', FolderSchema);
