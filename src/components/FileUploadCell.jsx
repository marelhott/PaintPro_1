import React, { useState, useRef, useEffect } from 'react';
import fileManager from '../utils/FileManager';

const FileUploadCell = ({ zakazka, onFilesUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [parsedFiles, setParsedFiles] = useState([]);

  useEffect(() => {
    try {
      if (zakazka.soubory) {
        setParsedFiles(typeof zakazka.soubory === 'string' ? JSON.parse(zakazka.soubory) : zakazka.soubory);
      } else {
        setParsedFiles([]);
      }
    } catch (error) {
      console.error("Error parsing soubory:", error);
      setParsedFiles([]);
    }
  }, [zakazka.soubory]);


  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        // Validace souboru
        const validation = fileManager.validateFile(file);
        if (!validation.valid) {
          throw new Error(`${file.name}: ${validation.error}`);
        }

        // Upload do localStorage
        const result = await fileManager.uploadFile(file, zakazka.id.toString());
        if (!result.success) {
          throw new Error(`${file.name}: ${result.error}`);
        }

        // Aktualizace progressu
        setUploadProgress(Math.round(((index + 1) / selectedFiles.length) * 100));

        return result.fileObject;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const currentFiles = parsedFiles || [];
      const newFiles = [...currentFiles, ...uploadedFiles];

      // Aktualizuj soubory
      onFilesUpdate(zakazka.id, newFiles);

      // Zobrazit úspěšnou zprávu
      if (uploadedFiles.length === 1) {
        console.log(`✅ Soubor ${uploadedFiles[0].name} úspěšně nahrán`);
      } else {
        console.log(`✅ Úspěšně nahráno ${uploadedFiles.length} souborů`);
      }

    } catch (error) {
      console.error('❌ Chyba při uploadu:', error);
      alert(`Chyba při nahrávání souboru: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = (fileObj) => {
    console.log('📥 Stahování souboru:', fileObj.name);
    fileManager.downloadFile(fileObj.url, fileObj.name);
  };

  const handleDelete = (fileId) => {
    if (window.confirm('Opravdu chcete smazat tento soubor?')) {
      const result = fileManager.deleteFile(fileId);
      if (result.success) {
        const updatedFiles = parsedFiles.filter(f => f.id !== fileId);
        onFilesUpdate(zakazka.id, updatedFiles);
      } else {
        alert('Chyba při mazání souboru: ' + result.error);
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('video/')) return '🎥';
    if (fileType.includes('audio/')) return '🎵';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📁';
  };

  const filesCount = parsedFiles?.length || 0;
  const hasFiles = filesCount > 0;
  const totalSize = parsedFiles?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;

  return (
    <div style={{ position: 'relative', minWidth: '120px' }}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="*/*"
      />

      {!hasFiles ? (
        <button
          style={{
            background: 'transparent',
            color: '#6b7280',
            border: '1px solid #9ca3af',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            position: 'relative'
          }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              {uploadProgress}%
            </div>
          ) : 'nahraj soubor'}
        </button>
      ) : (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <span 
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            {filesCount}
            {isUploading && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid #10B981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            )}
          </span>

          {showDropdown && (
            <div 
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                border: '2px solid #4F46E5',
                borderRadius: '12px',
                boxShadow: '0 15px 50px rgba(0, 0, 0, 0.3)',
                zIndex: 999999,
                minWidth: '350px',
                maxWidth: '450px',
                padding: '20px',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: '0', color: '#333', fontSize: '16px' }}>
                  Nahrané soubory ({filesCount})
                </h4>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {fileManager.formatFileSize(totalSize)}
                </div>
              </div>

              {parsedFiles.map((file, index) => (
                <div key={file.id || index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: index < parsedFiles.length - 1 ? '1px solid #eee' : 'none'
                }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '16px' }}>
                      {getFileIcon(file.type)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#333', 
                        fontWeight: '500',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280',
                        marginTop: '2px'
                      }}>
                        {fileManager.formatFileSize(file.size)}
                        {file.compressed && ' (komprimováno)'}
                        {file.originalSize && file.originalSize > file.size && 
                          ` • úspora ${fileManager.formatFileSize(file.originalSize - file.size)}`
                        }
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                    <button
                      style={{
                        background: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onClick={() => handleDownload(file)}
                    >
                      📥 stáhnout
                    </button>
                    <button
                      style={{
                        background: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onClick={() => handleDelete(file.id)}
                    >
                      🗑️ smazat
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                <button
                  style={{
                    background: 'transparent',
                    color: '#6366F1',
                    border: '1px dashed #6366F1',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    width: '100%',
                    fontWeight: '500'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid #e5e7eb',
                        borderTop: '2px solid #6366F1',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Nahrávám... {uploadProgress}%
                    </div>
                  ) : '+ Přidat další soubory'}
                </button>

                <div style={{ 
                  fontSize: '11px', 
                  color: '#6b7280', 
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  Max. velikost: {fileManager.maxFileSize / (1024*1024)}MB | 
                  Podporované formáty: obrázky, PDF, dokumenty, videa, audio, archivy
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FileUploadCell;