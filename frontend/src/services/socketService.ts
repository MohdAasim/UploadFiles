import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import type { NotificationData, OnlineUser } from '../types';

// Define proper callback types
type EventCallback<T = unknown> = (data: T) => void;

// Define socket event data types
interface FileUploadedData {
  file: {
    originalName: string;
    _id: string;
  };
  uploadedBy: {
    name: string;
  };
  parentFolder?: string;
}

interface UserEditingData {
  fileId: string;
  userId: string;
  userName: string;
}

interface FileBeingEditedData {
  fileId: string;
  editor: {
    userName: string;
    userId: string;
  };
}

interface ResourceSharedData {
  resourceId: string;
  resourceType: 'file' | 'folder';
  permission: string;
  sharedBy: {
    name: string;
    id: string;
  };
}

interface PermissionUpdatedData {
  resourceId: string;
  newPermission: string;
  updatedBy: {
    name: string;
    id: string;
  };
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners: Map<string, EventCallback[]> = new Map();

  connect(token: string): void {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to real-time server');
      this.isConnected = true;
      toast.success('Connected to real-time server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from real-time server');
      this.isConnected = false;
      toast.error('Disconnected from real-time server');
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // File events
    this.socket.on('new-file-uploaded', (data: FileUploadedData) => {
      toast.success(`New file uploaded: ${data.file.originalName}`);
      this.emit('fileListUpdated');
    });

    this.socket.on('user-started-editing', (data: UserEditingData) => {
      toast(`${data.userName} started editing a file`, {
        icon: 'ℹ️',
        duration: 3000,
      });
      this.emit('userStartedEditing', data);
    });

    this.socket.on('user-stopped-editing', (data: UserEditingData) => {
      this.emit('userStoppedEditing', data);
    });

    this.socket.on('file-being-edited', (data: FileBeingEditedData) => {
      toast(`File is being edited by ${data.editor.userName}`, {
        icon: '⚠️',
        duration: 4000,
      });
    });

    // Sharing events
    this.socket.on('resource-shared-with-you', (data: ResourceSharedData) => {
      toast.success(`${data.sharedBy.name} shared a ${data.resourceType} with you`);
      this.emit('resourceShared', data);
    });

    this.socket.on('permission-updated', (data: PermissionUpdatedData) => {
      toast(`Your permission was updated by ${data.updatedBy.name}`, {
        icon: 'ℹ️',
        duration: 4000,
      });
      this.emit('permissionUpdated', data);
    });

    // Notifications
    this.socket.on('notification', (data: NotificationData) => {
      const getIcon = (type: string): string => {
        switch (type) {
          case 'error':
            return '❌';
          case 'warning':
            return '⚠️';
          case 'success':
            return '✅';
          default:
            return 'ℹ️';
        }
      };

      toast(data.message, { 
        icon: getIcon(data.type),
        duration: 4000,
      });
      this.emit('notification', data);
    });

    // Online users
    this.socket.on('online-users', (users: OnlineUser[]) => {
      this.emit('onlineUsersUpdated', users);
    });
  }

  // Event emitter pattern for components to listen to socket events
  on<T = unknown>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback as EventCallback);
  }

  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback as EventCallback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit<T = unknown>(event: string, data?: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // File editing methods
  startEditingFile(fileId: string): void {
    this.socket?.emit('start-editing-file', { fileId });
  }

  stopEditingFile(fileId: string): void {
    this.socket?.emit('stop-editing-file', { fileId });
  }

  // Collaboration methods
  joinCollaboration(resourceId: string): void {
    this.socket?.emit('join-collaboration', { resourceId });
  }

  leaveCollaboration(resourceId: string): void {
    this.socket?.emit('leave-collaboration', { resourceId });
  }

  // Notification methods
  sendNotification(
    targetUserId: string, 
    type: string, 
    message: string, 
    resourceId?: string
  ): void {
    this.socket?.emit('send-notification', {
      targetUserId,
      type,
      message,
      resourceId
    });
  }

  // Utility methods
  getOnlineUsers(): void {
    this.socket?.emit('get-online-users');
  }

  checkUserOnline(userId: string): void {
    this.socket?.emit('check-user-online', { userId });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export default new SocketService();