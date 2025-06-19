import { useUploadContext } from "../../contexts/UploadContext";
import UploadQueue from "../files/UploadQueue";

const UploadQueueContainer = () => {
  const {
    uploads,
    pauseUpload,
    resumeUpload,
    removeUpload,
    retryUpload,
    clearCompleted,
    clearAll,
    totalProgress,
  } = useUploadContext();

  return (
    <UploadQueue
      items={uploads}
      onPause={pauseUpload}
      onResume={resumeUpload}
      onCancel={removeUpload}
      onRetry={retryUpload}
      onClearCompleted={clearCompleted}
      onClearAll={clearAll}
      totalProgress={totalProgress}
    />
  );
};
export default UploadQueueContainer;