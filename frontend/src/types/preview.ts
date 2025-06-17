export interface PreviewContent {
  url: string;
  type: string;
  name: string;
}

export interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  previewContent: PreviewContent | null;
  loading: boolean;
  onDownload?: () => void;
}

export type SupportedPreviewTypes = 
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "text"
  | "json"
  | "unsupported";

/*eslint-disable*/
export interface PreviewHandlers {
  handlePreview: (file: any) => Promise<void>;
  handleClosePreview: () => void;
  handleDownload: (file: any) => Promise<void>;
}