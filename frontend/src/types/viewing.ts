export interface ViewerInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: Date;
}

export interface FileViewers {
  fileId: string;
  viewers: ViewerInfo[];
  lastUpdated: Date;
}
