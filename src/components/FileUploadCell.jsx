
import React, { useState, useRef } from 'react';
import FileManager from '../utils/FileManager';

const FileUploadCell = ({ zakazka, onFilesUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        // Validace souboru
        const validation = await FileManager.validateFile(file);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Upload do localStorage
        const result = await FileManager.uploadFile(file, zakazka.id.toString());
        if (!result.success) {
          throw new Error(result.error);
        }

        return result.fileObject;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const currentFiles = zakazka.soubory || [];
      const newFiles = [...currentFiles, ...uploadedFiles];

      // Aktualizuj soubory
      onFilesUpdate(zakazka.id, newFiles);

    } catch (error) {
      console.error('❌ Chyba při uploadu:', error);
      alert(`Chyba při nahrávání souboru: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = (fileObj) => {
    console.log('📥 Stahování souboru:', fileObj.name);
    FileManager.downloadFile(fileObj.url, fileObj.name);
  };

  const filesCount = zakazka.soubory?.length || 0;
  const hasFiles = filesCount > 0;

  console.log('🔍 FileUploadCell debug:', { 
    zakazkaId: zakazka.id, 
    filesCount, 
    hasFiles, 
    soubory: zakazka.soubory,
    showDropdown 
  });

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
        // Zobrazí "nahraj soubor" pokud nejsou žádné soubory
        <button
          style={{
            background: 'transparent',
            color: '#6b7280',
            border: '1px solid #9ca3af',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Nahrávám...' : 'nahraj soubor'}
        </button>
      ) : (
        // Zobrazí počet souborů s hover efektem
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
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => {
              console.log('🖱️ Mouse enter - zobrazuji dropdown');
              setShowDropdown(true);
            }}
            onMouseLeave={() => {
              console.log('🖱️ Mouse leave - skrývám dropdown');
              setShowDropdown(false);
            }}
          >
            {filesCount}
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
                minWidth: '250px',
                padding: '16px'
              }}
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Nahrané soubory:</h4>
              {zakazka.soubory.map((file, index) => (
                <div key={file.id || index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < zakazka.soubory.length - 1 ? '1px solid #eee' : 'none'
                }}>
                  <span style={{ fontSize: '14px', color: '#333', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </span>
                  <button
                    style={{
                      background: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleDownload(file)}
                  >
                    stáhnout
                  </button>
                </div>
              ))}
              <button
                style={{
                  background: 'transparent',
                  color: '#6366F1',
                  border: '1px dashed #6366F1',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '12px'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                + přidat další
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadCell;
