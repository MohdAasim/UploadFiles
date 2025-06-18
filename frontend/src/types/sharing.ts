export interface SharePermission {
  user: {
    id: string;
    name: string;
    email: string;
  };
  permission: 'view' | 'edit' | 'admin';
}

export interface ShareResourceRequest {
  resourceId: string;
  resourceType: 'file' | 'folder';
  targetUserEmail: string;
  permission: 'view' | 'edit' | 'admin';
}

export interface SharedResource {
  id: string;
  name: string;
  type: 'file' | 'folder';
  owner: {
    name: string;
    email: string;
  };
  permission: 'view' | 'edit' | 'admin';
  sharedAt: string;
  size?: number;
  mimetype?: string;
  path?: string;
}

export interface MySharedResource {
  id: string;
  name: string;
  type: 'file' | 'folder';
  sharedWith: SharePermission[];
  size?: number;
  mimetype?: string;
  path?: string;
}
