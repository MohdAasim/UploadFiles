import React, { createContext, useContext, useState, useCallback } from 'react';

interface UploadItem {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'waiting' | 'uploading' | 'paused' | 'completed' | 'error';
  error?: string;
  uploadSpeed?: string;
  timeRemaining?: string;
  startTime?: number;
}

interface UploadContextType {
  uploads: UploadItem[];
  addUpload: (item: Omit<UploadItem, 'id' | 'progress' | 'status'>) => string;
  updateProgress: (
    id: string,
    progress: number,
    uploadSpeed?: string,
    timeRemaining?: string
  ) => void;
  setStatus: (id: string, status: UploadItem['status'], error?: string) => void;
  removeUpload: (id: string) => void;
  pauseUpload: (id: string) => void;
  resumeUpload: (id: string) => void;
  retryUpload: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  totalProgress: number;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUploadContext = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUploadContext must be used within UploadProvider');
  }
  return context;
};

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const addUpload = useCallback(
    (item: Omit<UploadItem, 'id' | 'progress' | 'status'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newUpload: UploadItem = {
        ...item,
        id,
        progress: 0,
        status: 'waiting',
        startTime: Date.now(),
      };
      setUploads((prev) => [...prev, newUpload]);
      return id;
    },
    []
  );

  const updateProgress = useCallback(
    (
      id: string,
      progress: number,
      uploadSpeed?: string,
      timeRemaining?: string
    ) => {
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === id
            ? {
                ...upload,
                progress,
                uploadSpeed,
                timeRemaining,
                status: progress === 100 ? 'completed' : 'uploading',
              }
            : upload
        )
      );
    },
    []
  );

  const setStatus = useCallback(
    (id: string, status: UploadItem['status'], error?: string) => {
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === id ? { ...upload, status, error } : upload
        )
      );
    },
    []
  );

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== id));
  }, []);

  const pauseUpload = useCallback(
    (id: string) => {
      setStatus(id, 'paused');
    },
    [setStatus]
  );

  const resumeUpload = useCallback(
    (id: string) => {
      setStatus(id, 'uploading');
    },
    [setStatus]
  );

  const retryUpload = useCallback((id: string) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === id
          ? { ...upload, status: 'waiting', progress: 0, error: undefined }
          : upload
      )
    );
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) =>
      prev.filter((upload) => upload.status !== 'completed')
    );
  }, []);

  const clearAll = useCallback(() => {
    setUploads((prev) =>
      prev.filter((upload) => upload.status === 'uploading')
    );
  }, []);

  const totalProgress =
    uploads.length > 0
      ? uploads.reduce((sum, upload) => sum + upload.progress, 0) /
        uploads.length
      : 0;

  return (
    <UploadContext.Provider
      value={{
        uploads,
        addUpload,
        updateProgress,
        setStatus,
        removeUpload,
        pauseUpload,
        resumeUpload,
        retryUpload,
        clearCompleted,
        clearAll,
        totalProgress,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
};
