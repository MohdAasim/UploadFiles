/* eslint-disable */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filesAPI, foldersAPI } from "../services/api";
import toast from "react-hot-toast";
import socketService from "../services/socketService";

export const useFiles = (parentFolder?: string) => {
  return useQuery({
    queryKey: ["files", parentFolder],
    queryFn: () => filesAPI.getFiles(parentFolder),
    select: (data) => {
      console.log("Files API response:", data);
      const files = data?.data?.data || data?.data || data || [];
      console.log("Processed files:", files);
      return Array.isArray(files) ? files : [];
    },
  });
};

export const useFolders = () => {
  return useQuery({
    queryKey: ["folders"],
    queryFn: () => foldersAPI.getFolderTree(),
    select: (data) => {
      console.log("Folders API response:", data);
      const folders = data?.data?.data || data?.data || data || [];
      console.log("Processed folders:", folders);
      return Array.isArray(folders) ? folders : [];
    },
  });
};

// Enhanced upload hook with better progress tracking
export const useUploadFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      formData: FormData;
      onProgress?: (progress: number) => void;
    }) => {
      const { formData, onProgress } = data;

      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress?.(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error("Invalid response format"));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
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
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File uploaded successfully!");

      // Emit socket event for real-time updates
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

// Batch upload hook
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
    }) =>
      foldersAPI.createFolder(name, parent, { description, tags, isTemplate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Folder created successfully!");
    },
    onError: (error: any) => {
      toast.error(`Create folder failed: ${error?.message || "Unknown error"}`);
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) => foldersAPI.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("Folder deleted successfully!");
    },
    onError: (error) => {
      toast.error(`Delete folder failed: ${error.message}`);
    },
  });
};
