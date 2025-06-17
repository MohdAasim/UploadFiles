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
  private connectionAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  connect(token: string): void {
    // Prevent multiple connection attempts
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    console.log('Attempting to connect to socket server:', SOCKET_URL);

    try {
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        console.log("Connected to real-time server");
        this.isConnected = true;
        this.isConnecting = false;
        this.connectionAttempts = 0;
        toast.success("Connected to real-time server");
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Disconnected from real-time server:", reason);
        this.isConnected = false;
        this.isConnecting = false;
        
        // Only show error toast for unexpected disconnections
        if (reason !== 'io client disconnect') {
          toast.error("Disconnected from real-time server");
        }
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        this.isConnecting = false;
        this.connectionAttempts++;
        
        if (this.connectionAttempts >= this.maxReconnectAttempts) {
          toast.error("Failed to connect to real-time server");
        }
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log(`Reconnected after ${attemptNumber} attempts`);
        toast.success("Reconnected to real-time server");
      });

      this.socket.on("reconnect_failed", () => {
        console.error("Failed to reconnect to socket server");
        toast.error("Failed to reconnect to real-time server");
        this.isConnecting = false;
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Error creating socket connection:', error);
      this.isConnecting = false;
      toast.error("Failed to initialize real-time connection");
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // File events
    this.socket.on("new-file-uploaded", (data: FileUploadedData) => {
      toast.success(`New file uploaded: ${data.file.originalName}`);
      this.triggerEvent("fileListUpdated");
    });

    this.socket.on("user-started-editing", (data: UserEditingData) => {
      toast(`${data.userName} started editing a file`, {
        icon: "ℹ️",
        duration: 3000,
      });
      this.triggerEvent("userStartedEditing", data);
    });

    this.socket.on("user-stopped-editing", (data: UserEditingData) => {
      this.triggerEvent("userStoppedEditing", data);
    });

    this.socket.on("file-being-edited", (data: FileBeingEditedData) => {
      toast(`File is being edited by ${data.editor.userName}`, {
        icon: "⚠️",
        duration: 4000,
      });
    });

    // Sharing events
    this.socket.on("resource-shared-with-you", (data: ResourceSharedData) => {
      toast.success(
        `${data.sharedBy.name} shared a ${data.resourceType} with you`
      );
      this.triggerEvent("resourceShared", data);
    });

    this.socket.on("permission-updated", (data: PermissionUpdatedData) => {
      toast(`Your permission was updated by ${data.updatedBy.name}`, {
        icon: "ℹ️",
        duration: 4000,
      });
      this.triggerEvent("permissionUpdated", data);
    });

    // Notifications
    this.socket.on("notification", (data: NotificationData) => {
      const getIcon = (type: string): string => {
        switch (type) {
          case "error":
            return "❌";
          case "warning":
            return "⚠️";
          case "success":
            return "✅";
          default:
            return "ℹ️";
        }
      };

      toast(data.message, {
        icon: getIcon(data.type),
        duration: 4000,
      });
      this.triggerEvent("notification", data);
    });

    // Online users
    this.socket.on("online-users", (users: OnlineUser[]) => {
      this.triggerEvent("onlineUsersUpdated", users);
    });
  }

  // File viewing events
  startViewingFile(fileId: string) {
    if (this.socket?.connected) {
      console.log("Starting to view file:", fileId);
      this.socket.emit("start-viewing-file", { fileId });
    } else {
      console.warn("Cannot start viewing file - socket not connected");
    }
  }

  stopViewingFile(fileId: string) {
    if (this.socket?.connected) {
      console.log("Stopping viewing file:", fileId);
      this.socket.emit("stop-viewing-file", { fileId });
    } else {
      console.warn("Cannot stop viewing file - socket not connected");
    }
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

  // Make this method private since it's for internal event triggering
  private triggerEvent<T = unknown>(event: string, data?: T): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // PUBLIC METHODS - Add these public methods for emitting socket events

  // Public method to emit socket events to the server
  public emit<T = unknown>(event: string, data?: T): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Socket not connected, cannot emit event:", event);
    }
  }

  /*eslint-disable @typescript-eslint/no-explicit-any */
  // Specific method for file upload events
  public notifyFileUploaded(fileData: any, parentFolder?: string): void {
    this.emit("file-uploaded", { fileData, parentFolder });
  }

  // File editing methods
  startEditingFile(fileId: string): void {
    this.emit("start-editing-file", { fileId });
  }

  stopEditingFile(fileId: string): void {
    this.emit("stop-editing-file", { fileId });
  }

  // Collaboration methods
  joinCollaboration(resourceId: string): void {
    this.emit("join-collaboration", { resourceId });
  }

  leaveCollaboration(resourceId: string): void {
    this.emit("leave-collaboration", { resourceId });
  }

  // Notification methods
  sendNotification(
    targetUserId: string,
    type: string,
    message: string,
    resourceId?: string
  ): void {
    this.emit("send-notification", {
      targetUserId,
      type,
      message,
      resourceId,
    });
  }

  // Utility methods
  getOnlineUsers(): void {
    this.emit("get-online-users");
  }

  checkUserOnline(userId: string): void {
    this.emit("check-user-online", { userId });
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.isConnected = false;
      this.isConnecting = false;
      
      // Remove all listeners before disconnecting
      this.socket.removeAllListeners();
      
      // Gracefully disconnect
      this.socket.disconnect();
      this.socket = null;
      
      // Clear local listeners
      this.listeners.clear();
      
      console.log('Socket disconnected successfully');
    }
  }

  // Method to check if socket should reconnect
  public shouldReconnect(): boolean {
    return !this.isConnected && !this.isConnecting && this.connectionAttempts < this.maxReconnectAttempts;
  }

  // Method to force reconnect
  public forceReconnect(token: string): void {
    this.disconnect();
    setTimeout(() => {
      this.connect(token);
    }, 1000);
  }

  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  get connecting(): boolean {
    return this.isConnecting;
  }
}

export default new SocketService();