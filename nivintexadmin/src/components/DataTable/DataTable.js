import { useState, useEffect } from 'react';
import { confirmToast } from '../../utils/confirmToast';

export default function DataTable({ columns, initialRows = [], renderRow }) {
  const [rows, setRows] = useState(Array.isArray(initialRows) ? initialRows : []);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setRows(Array.isArray(initialRows) ? initialRows : []);
  }, [initialRows]);

  const filtered = rows.filter((r) =>
    Object.values(r).join(' ').toLowerCase().includes(query.toLowerCase())
  );

  const deleteRow = async (id) => {
    if (await confirmToast('Are you sure you want to delete this item?', 'Delete')) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div>
      <div className="section-header">
        <input
          className="search-input"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="km-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => <th key={col}>{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="km-empty">
                  No items found.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => renderRow(row, i, deleteRow))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
