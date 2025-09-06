import React, { useState, useEffect, useRef } from "react";
import {
  getMedia,
  addMedia,
  type MediaFile,
  type AddMediaRequest,
} from "ankidroid-api-client";

interface MediaManagerProps {
  available: boolean;
}

export const MediaManager: React.FC<MediaManagerProps> = ({ available }) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (available) {
      fetchMediaFiles();
    }
  }, [available]);

  const fetchMediaFiles = async () => {
    try {
      setLoading(true);
      const fetchedFiles = await getMedia();
      setMediaFiles(fetchedFiles);
      setError("");
    } catch (error) {
      setError(`Error fetching media files: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setLoading(true);
      setUploadProgress(`Uploading ${file.name}...`);
      setError("");

      // Convert file to base64
      const base64Data = await fileToBase64(file);

      const request: AddMediaRequest = {
        filename: file.name,
        data: base64Data,
      };

      const result = await addMedia(request);
      
      if (result.success) {
        setUploadProgress(`Successfully uploaded ${file.name}`);
        await fetchMediaFiles(); // Refresh media list
      } else {
        setError(result.error || `Failed to upload ${file.name}`);
      }
    } catch (error) {
      setError(`Error uploading ${file.name}: ${error}`);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(""), 3000);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return '🖼️';
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'm4a':
        return '🔊';
      case 'mp4':
      case 'webm':
      case 'avi':
        return '🎬';
      case 'pdf':
        return '📄';
      case 'txt':
        return '📝';
      default:
        return '📎';
    }
  };

  const getSupportedFileTypes = (): string => {
    return "Images (jpg, png, gif, webp), Audio (mp3, wav, ogg), Video (mp4, webm), Documents (pdf, txt)";
  };

  if (!available) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>AnkiDroid API is not available. Please ensure AnkiDroid is installed and permissions are granted.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Media Manager</h2>

      {/* Upload Section */}
      <div style={{ 
        marginBottom: "30px", 
        padding: "20px", 
        border: "1px solid #ccc", 
        borderRadius: "8px",
        backgroundColor: "#f9f9f9"
      }}>
        <h3>Upload Media</h3>
        
        <div 
          style={{
            border: "2px dashed #007bff",
            borderRadius: "8px",
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f8f9fa",
            marginBottom: "15px",
            cursor: "pointer"
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>📁</div>
          <div style={{ fontSize: "18px", marginBottom: "8px" }}>
            Drop files here or click to browse
          </div>
          <div style={{ fontSize: "14px", color: "#6c757d" }}>
            Supported: {getSupportedFileTypes()}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,video/*,.pdf,.txt"
          onChange={(e) => handleFileUpload(e.target.files)}
          style={{ display: "none" }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Uploading..." : "Choose Files"}
        </button>

        {uploadProgress && (
          <div style={{ 
            marginTop: "15px", 
            padding: "10px", 
            backgroundColor: "#d4edda", 
            border: "1px solid #c3e6cb",
            borderRadius: "4px",
            color: "#155724"
          }}>
            {uploadProgress}
          </div>
        )}

        <div style={{ marginTop: "15px", fontSize: "14px", color: "#6c757d" }}>
          <strong>Note:</strong> Media upload functionality depends on AnkiDroid's AddContentApi integration. 
          The current implementation shows the interface but may require additional API setup.
        </div>
      </div>

      {/* Media Files List */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3>Media Files ({mediaFiles.length})</h3>
          <button
            onClick={fetchMediaFiles}
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#17a2b8",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {mediaFiles.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px" }}>
            {mediaFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ fontSize: "24px", marginRight: "10px" }}>
                    {getFileTypeIcon(file.filename)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold", wordBreak: "break-word" }}>
                      {file.filename}
                    </div>
                    {file.size && (
                      <div style={{ fontSize: "14px", color: "#6c757d" }}>
                        {formatFileSize(file.size)}
                      </div>
                    )}
                  </div>
                </div>

                {file.lastModified && (
                  <div style={{ fontSize: "12px", color: "#6c757d" }}>
                    Modified: {new Date(file.lastModified).toLocaleString()}
                  </div>
                )}

                {file.type && (
                  <div style={{ fontSize: "12px", color: "#6c757d", marginTop: "4px" }}>
                    Type: {file.type}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
            <div style={{ fontSize: "48px", marginBottom: "15px" }}>📂</div>
            <p>No media files found.</p>
            <p style={{ fontSize: "14px" }}>
              Upload files using the section above, or ensure AnkiDroid has media files in your collection.
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          marginTop: "20px", 
          padding: "15px", 
          backgroundColor: "#f8d7da", 
          border: "1px solid #f5c6cb",
          borderRadius: "4px",
          color: "#721c24"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Media Integration Help */}
      <div style={{ 
        marginTop: "30px", 
        padding: "20px", 
        backgroundColor: "#e3f2fd", 
        border: "1px solid #bbdefb",
        borderRadius: "8px",
        color: "#1565c0"
      }}>
        <h4>Media Integration Tips:</h4>
        <ul style={{ margin: "10px 0", paddingLeft: "20px" }}>
          <li>Media files are stored in AnkiDroid's collection.media directory</li>
          <li>Reference media in your notes using: [sound:filename.mp3] or &lt;img src="image.jpg"&gt;</li>
          <li>Supported formats vary by device capabilities</li>
          <li>Large files may take longer to sync between devices</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaManager;