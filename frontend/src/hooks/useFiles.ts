/* eslint-disable */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filesAPI, foldersAPI } from "../services/api";
import toast from "react-hot-toast";
import socketService from "../services/socketService";
import { useUploadContext } from "../contexts/UploadContext";

export const useFiles = (parentFolder?: string) => {
  return useQuery({
    queryKey: ["files", parentFolder],
    queryFn: () => filesAPI.getFiles(parentFolder),
    select: (data) => {
      console.log("Files API response:", data);
      // Fix: Handle the nested data structure
      const files =
        data?.data?.data?.files || data?.data?.files || data?.data || [];
      console.log("Processed files:", files);
      return Array.isArray(files) ? files : [];
    },
  });
};

export const useFolders = () => {
  return useQuery({
    queryKey: ["folders"],
    queryFn: () => foldersAPI.getAllFolders(),
    select: (data) => {
      console.log("All Folders API response:", data);
      // Fix: Handle the nested data structure
      const folders = data?.data?.data?.folders || data?.data?.folders || [];
      console.log("Processed all folders:", folders);
      return Array.isArray(folders) ? folders : [];
    },
  });
};

// Add new hook for folder tree (files + folders in current directory)
export const useFolderTree = (parentFolder?: string) => {
  return useQuery({
    queryKey: ["folderTree", parentFolder],
    queryFn: () => foldersAPI.getFolderTree(parentFolder),
    select: (data) => {
      console.log("Folder tree API response:", data);
      const result = data?.data?.data || data?.data || {};
      return {
        folders: Array.isArray(result.folders) ? result.folders : [],
        files: Array.isArray(result.files) ? result.files : [],
        folderCount: result.folderCount || 0,
        fileCount: result.fileCount || 0,
        currentFolder: result.currentFolder || null,
      };
    },
  });
};

// Enhanced upload hook with progress tracking
export const useUploadFile = () => {
  const queryClient = useQueryClient();
  const { addUpload, updateProgress, setStatus, removeUpload } =
    useUploadContext();

  return useMutation({
    mutationFn: async (data: {
      formData: FormData;
      onProgress?: (progress: number) => void;
    }) => {
      const { formData, onProgress } = data;

      // Get file info for progress tracking
      const file = formData.get("file") as File;
      const uploadId = addUpload({
        fileName: file.name,
        fileSize: file.size,
      });

      setStatus(uploadId, "uploading");

      // Calculate upload speed and time remaining
      let startTime = Date.now();
      let lastLoaded = 0;
      let lastTime = startTime;

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);

            // Calculate upload speed and time remaining
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTime) / 1000; // seconds
            const loadedDiff = event.loaded - lastLoaded;

            if (timeDiff > 1) {
              // Update every second
              const uploadSpeed = loadedDiff / timeDiff; // bytes per second
              const remainingBytes = event.total - event.loaded;
              const timeRemaining = remainingBytes / uploadSpeed; // seconds

              const speedStr = formatSpeed(uploadSpeed);
              const timeStr = formatTime(timeRemaining);

              updateProgress(uploadId, progress, speedStr, timeStr);
              lastLoaded = event.loaded;
              lastTime = currentTime;
            } else {
              updateProgress(uploadId, progress);
            }

            onProgress?.(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              setStatus(uploadId, "completed");
              // Remove completed upload after 3 seconds
              setTimeout(() => removeUpload(uploadId), 3000);
              resolve(response);
            } catch {
              setStatus(uploadId, "error", "Invalid response format");
              reject(new Error("Invalid response format"));
            }
          } else {
            setStatus(
              uploadId,
              "error",
              `Upload failed with status ${xhr.status}`
            );
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          setStatus(uploadId, "error", "Network error during upload");
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          setStatus(uploadId, "error", "Upload cancelled");
          reject(new Error("Upload cancelled"));
        });

        const token = localStorage.getItem("token");
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        xhr.open("POST", `${API_BASE_URL}/files/upload`);
        if (token) {
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
        xhr.send(formData);
      });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["folderTree"] });
      toast.success("File uploaded successfully!");

      socketService.emit("file-uploaded", {
        fileData: response.file,
        parentFolder: response.file.parentFolder,
      });
    },
    onError: (error: any) => {
      toast.error(`Upload failed: ${error?.message || "Unknown error"}`);
    },
  });
};

// Helper functions
const formatSpeed = (bytesPerSecond: number): string => {
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let unitIndex = 0;
  let speed = bytesPerSecond;

  while (speed >= 1024 && unitIndex < units.length - 1) {
    speed /= 1024;
    unitIndex++;
  }

  return `${speed.toFixed(1)} ${units[unitIndex]}`;
};

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
};

export const useBatchUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      files: File[];
      parentFolder?: string;
      onProgress?: (fileIndex: number, progress: number) => void;
      onFileComplete?: (fileIndex: number, response: any) => void;
    }) => {
      const { files, parentFolder, onProgress, onFileComplete } = data;
      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        if (parentFolder) {
          formData.append("parentFolder", parentFolder);
        }

        try {
          const result = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (event) => {
              if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress?.(i, progress);
              }
            });

            xhr.addEventListener("load", () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  onFileComplete?.(i, response);
                  resolve(response);
                } catch (error) {
                  reject(new Error("Invalid response format"));
                }
              } else {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            });

            xhr.addEventListener("error", () => {
              reject(new Error("Network error during upload"));
            });

            const token = localStorage.getItem("token");
            // Fix: Use the correct API URL with base URL and version
            const API_BASE_URL =
              import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
            xhr.open("POST", `${API_BASE_URL}/files/upload`);
            if (token) {
              xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }
            xhr.send(formData);
          });

          results.push({ success: true, file: file.name, data: result });
        } catch (error: any) {
          results.push({
            success: false,
            file: file.name,
            error: error.message,
          });
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Batch upload completed!");
    },
    onError: (error: any) => {
      toast.error(`Batch upload failed: ${error?.message || "Unknown error"}`);
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => filesAPI.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Delete failed: ${error?.message || "Unknown error"}`);
    },
  });
};

// Add the missing delete folder hook if it doesn't exist
export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) => foldersAPI.deleteFolder(folderId),
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["folderTree"] });
      toast.success("Folder deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Delete folder failed: ${error?.message || "Unknown error"}`);
    },
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      parent,
      description,
      tags,
      isTemplate,
    }: {
      name: string;
      parent?: string;
      description?: string;
      tags?: string[];
      isTemplate?: boolean;
    }) => {
      return foldersAPI.createFolder(name, parent, {
        description,
        tags,
        isTemplate,
      });
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["folderTree"] });
      toast.success("Folder created successfully!");
    },
    onError: (error: any) => {
      toast.error(`Create folder failed: ${error?.message || "Unknown error"}`);
    },
  });
};
