import React, { memo, useMemo, useState, useRef } from 'react';

// Komponenta pro upload souborů v optimalizované tabulce
const FileUploadCell = ({ zakazka, onFilesUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [localFiles, setLocalFiles] = useState(zakazka.soubory || []);
  const fileInputRef = useRef(null);

  // Synchronizuj lokální stav s props při změně
  React.useEffect(() => {
    setLocalFiles(zakazka.soubory || []);
  }, [zakazka.soubory]);

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const newUploadedFiles = [];

      for (const file of selectedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Soubor ${file.name} je příliš velký (maximum 10MB)`);
        }

        const fileObject = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date().toISOString(),
          zakazkaId: zakazka.id
        };

        const reader = new FileReader();
        const base64Data = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        fileObject.data = base64Data;
        newUploadedFiles.push(fileObject);
      }

      const currentFiles = localFiles || [];
      const updatedFiles = [...currentFiles, ...newUploadedFiles];

      // Aktualizuj lokální stav okamžitě
      setLocalFiles(updatedFiles);

      // Zavolej callback pro aktualizaci v rodičovské komponentě
      onFilesUpdate(updatedFiles);

      console.log(`✅ Nahráno ${newUploadedFiles.length} souborů pro zakázku ${zakazka.id}`);

    } catch (error) {
      console.error('❌ Chyba při uploadu:', error);
      alert(`Chyba při nahrávání: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileDownload = (fileObj) => {
    try {
      const link = document.createElement('a');
      link.href = fileObj.data;
      link.download = fileObj.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('Chyba při stahování souboru');
    }
  };

  const handleFileDelete = (fileId) => {
    const currentFiles = localFiles || [];
    const updatedFiles = currentFiles.filter(file => file.id !== fileId);
    setLocalFiles(updatedFiles);
    onFilesUpdate(updatedFiles);
  };

  const filesCount = localFiles?.length || 0;
  const hasFiles = filesCount > 0;

  return (
    <div style={{ position: 'relative', minWidth: '120px' }}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
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
            cursor: isUploading ? 'not-allowed' : 'pointer',
            opacity: isUploading ? 0.6 : 1
          }}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Nahrávám...' : 'Nahrát soubor'}
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
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setTimeout(() => setShowDropdown(false), 100)}
          >
            {filesCount}
          </span>

          {showDropdown && (
            <div 
              style={{
                position: 'absolute',
                top: '40px',
                right: '0',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                zIndex: 999999,
                minWidth: '280px',
                padding: '16px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h4 style={{ margin: 0, color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                  Nahrané soubory
                </h4>
                <button
                  style={{
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  + Přidat
                </button>
              </div>

              {localFiles.map((file, index) => (
                <div 
                  key={file.id || index} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: index < localFiles.length - 1 ? '1px solid #f3f4f6' : 'none'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#111827', 
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
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                    <button
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleFileDownload(file)}
                    >
                      Stáhnout
                    </button>
                    <button
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleFileDelete(file.id)}
                    >
                      Smazat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Optimalizovaný řádek tabulky
const OrderRow = memo(({ zakazka, index, startIndex, onEdit, onDelete, onFilesUpdate }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <tr className="table-row">
      <td className="order-number">{startIndex + index + 1}</td>
      <td>{zakazka.datum}</td>
      <td>{zakazka.druh}</td>
      <td>{zakazka.klient}</td>
      <td>{zakazka.cislo}</td>
      <td className="amount-bold-black">{zakazka.castka.toLocaleString()}</td>
      <td>{zakazka.fee.toLocaleString()}</td>
      <td>{(zakazka.castka - zakazka.fee).toLocaleString()}</td>
      <td>{zakazka.palivo.toLocaleString()}</td>
      <td>{zakazka.material.toLocaleString()}</td>
      <td>{zakazka.pomocnik.toLocaleString()}</td>
      <td className="profit-bold-green">{zakazka.zisk.toLocaleString()}</td>
      <td className="address-cell">{zakazka.adresa || '-'}</td>
      <td>
        <span className={'typ-badge typ-' + (zakazka.typ || 'nezadano')}>
          {zakazka.typ || '-'}
        </span>
      </td>
      <td>
        {zakazka.dobaRealizace ? `${zakazka.dobaRealizace} ${zakazka.dobaRealizace === 1 ? 'den' : zakazka.dobaRealizace <= 4 ? 'dny' : 'dní'}` : '1 den'}
      </td>
      <td>{zakazka.poznamka || zakazka.poznamky || '-'}</td>
      <td>
        <FileUploadCell zakazka={zakazka} onFilesUpdate={(files) => onFilesUpdate(zakazka.id, files)} />
      </td>
      <td>
        {/* Dva samostatná tlačítka vedle sebe */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(zakazka);
              }}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
              title="Upravit zakázku"
            >
              ✏️ Upravit
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.confirm('Opravdu chcete smazat tuto zakázku?')) {
                  onDelete(zakazka.id);
                }
              }}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
              title="Smazat zakázku"
            >
              🗑️ Smazat
            </button>
          </div>
      </td>
    </tr>
  );
});

// Virtualizovaná tabulka pro velké datasety
const OptimizedOrderTable = memo(({ 
  zakazkyData, 
  currentPage, 
  itemsPerPage,
  onEdit,
  onDelete,
  onFilesUpdate,
  filteredOrders,
  setCurrentPage,
  totalPages,
  startIndex
}) => {
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return zakazkyData.slice(startIndex, endIndex);
  }, [zakazkyData, currentPage, itemsPerPage]);

  return (
    <>
    <table className="orders-table">
      <thead>
        <tr>
          <th>#</th>
          <th>DATUM</th>
          <th>DRUH PRÁCE</th>
          <th>KLIENT</th>
          <th>ID ZAKÁZKY</th>
          <th>TRŽBA</th>
          <th>FEE</th>
          <th>FEE OFF</th>
          <th>PALIVO</th>
          <th>MATERIÁL</th>
          <th>POMOCNÍK</th>
          <th>ČISTÝ ZISK</th>
          <th>ADRESA</th>
          <th>TYP</th>
          <th>DOBA REALIZACE</th>
          <th>POZNÁMKY</th>
          <th>SOUBORY</th>
          <th>AKCE</th>
        </tr>
      </thead>
      <tbody>
        {paginatedData.map((zakazka, index) => (
          <OrderRow
            key={zakazka.id}
            zakazka={zakazka}
            index={index}
            startIndex={(currentPage - 1) * itemsPerPage}
            onEdit={onEdit}
            onDelete={onDelete}
            onFilesUpdate={onFilesUpdate}
          />
        ))}
      </tbody>
    </table>
    {/* Decentní paginace vpravo dole */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: '16px',
        padding: '12px 0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}>
          <span>
            {startIndex + 1} - {Math.min(startIndex + itemsPerPage, zakazkyData.length)} z {zakazkyData.length}
          </span>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 8px',
                border: 'none',
                borderRadius: '4px',
                background: 'transparent',
                color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--text-secondary)';
                }
              }}
            >
              ‹
            </button>

            <span style={{
              padding: '4px 8px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              minWidth: '60px',
              textAlign: 'center'
            }}>
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 8px',
                border: 'none',
                borderRadius: '4px',
                background: 'transparent',
                color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-secondary)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: currentPage === totalPages ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--text-secondary)';
                }
              }}
            >
              ›
            </button>
          </div>
        </div>
      </div>
      </>
  );
});

export default OptimizedOrderTable;