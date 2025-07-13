import React, { memo, useMemo, useState } from 'react';

// Importujeme FileUploadCell z hlavního App.jsx - zatím použijeme jednoduchý placeholder
const FileUploadCell = ({ zakazka, onFilesUpdate }) => {
  const filesCount = zakazka.soubory?.length || 0;
  return (
    <div style={{ minWidth: '120px' }}>
      {filesCount > 0 ? (
        <span style={{
          background: '#10B981',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          {filesCount}
        </span>
      ) : (
        <span style={{ color: '#6b7280', fontSize: '13px' }}>-</span>
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
      <td>{zakazka.poznamky || '-'}</td>
      <td>
        <FileUploadCell zakazka={zakazka} onFilesUpdate={(files) => onFilesUpdate(zakazka.id, files)} />
      </td>
      <td>
        <div className="action-menu-container" style={{ position: 'relative' }}>
          <button 
            className="action-menu-trigger"
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              alignItems: 'center'
            }}>
              <div style={{
                width: '4px',
                height: '4px',
                backgroundColor: '#6b7280',
                borderRadius: '50%'
              }}></div>
              <div style={{
                width: '4px',
                height: '4px',
                backgroundColor: '#6b7280',
                borderRadius: '50%'
              }}></div>
              <div style={{
                width: '4px',
                height: '4px',
                backgroundColor: '#6b7280',
                borderRadius: '50%'
              }}></div>
            </div>
          </button>

          {showDropdown && (
            <div 
              className="action-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                zIndex: 1000,
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                minWidth: '120px',
                overflow: 'hidden'
              }}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <button
                className="dropdown-item"
                onClick={() => {
                  onEdit(zakazka);
                  setShowDropdown(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ✏️ Upravit
              </button>
              <div style={{
                height: '1px',
                backgroundColor: '#e5e7eb',
                margin: '0 8px'
              }}></div>
              <button
                className="dropdown-item"
                onClick={() => {
                  onDelete(zakazka.id);
                  setShowDropdown(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                🗑️ Smazat
              </button>
            </div>
          )}
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