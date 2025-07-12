
```jsx
import React, { memo, useMemo } from 'react';

// Optimalizovaný řádek tabulky
const OrderRow = memo(({ zakazka, index, startIndex, onEdit, onDelete, onFilesUpdate }) => {
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
        <span className={`typ-badge typ-${zakazka.typ || 'nezadano'}`}>
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
        <div className="action-buttons">
          <button className="btn-icon btn-edit" onClick={() => onEdit(zakazka)} title="Upravit zakázku">
            ✏️
          </button>
          <button className="btn-icon btn-delete" onClick={() => onDelete(zakazka.id)} title="Smazat zakázku">
            🗑️
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
  onFilesUpdate 
}) => {
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return zakazkyData.slice(startIndex, endIndex);
  }, [zakazkyData, currentPage, itemsPerPage]);

  return (
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
  );
});

export default OptimizedOrderTable;
```
