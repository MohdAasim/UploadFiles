import type { FileWithPath } from '../components/files/BulkUpload';

export function processFiles(fileList: FileList | File[]): FileWithPath[] {
  const filesArray = Array.from(fileList);
  return filesArray.map((file, index) => {
    const relativePath =
      (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
      file.name;
    return {
      file,
      relativePath,
      id: `${Date.now()}-${index}`,
      status: 'pending' as const,
      progress: 0,
    };
  });
}

export function groupFilesByFolder(
  files: FileWithPath[]
): Record<string, FileWithPath[]> {
  return files.reduce(
    (acc, file) => {
      const pathParts = file.relativePath.split('/');
      const folder = pathParts.length > 1 ? pathParts[0] : 'Root';
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(file);
      return acc;
    },
    {} as Record<string, FileWithPath[]>
  );
}

export function getStatusIcon(
  status: FileWithPath['status'],
  icons: { [key: string]: React.ReactElement }
): React.ReactElement {
  switch (status) {
    case 'completed':
      return icons.CheckCircle;
    case 'error':
      return icons.Error;
    case 'uploading':
      return icons.CloudUpload;
    default:
      return icons.FolderOpen;
  }
}

export function getStatusColor(
  status: FileWithPath['status']
): 'default' | 'primary' | 'success' | 'error' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'error':
      return 'error';
    case 'uploading':
      return 'primary';
    default:
      return 'default';
  }
}

export function getProgressColor(
  status: FileWithPath['status']
):
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning'
  | 'inherit' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'error':
      return 'error';
    case 'uploading':
      return 'primary';
    default:
      return 'primary';
  }
}
