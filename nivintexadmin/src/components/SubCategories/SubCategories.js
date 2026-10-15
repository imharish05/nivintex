import { useEffect, useState } from 'react';
import DataTable from '../DataTable/DataTable';
import { categoryApi, subCategoryApi } from '../../api';

const pillClass = { Active: 'pill-active', Inactive: 'pill-inactive' };

export default function SubCategories({ showToast }) {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [subcategoryResult, categoryResult] = await Promise.allSettled([subCategoryApi.getAll(), categoryApi.getAll()]);
      if (subcategoryResult.status === 'rejected') throw subcategoryResult.reason;
      const subcategoryData = subcategoryResult.value;
      const categoryData = categoryResult.status === 'fulfilled' ? categoryResult.value : [];
      const subcategories = Array.isArray(subcategoryData)
        ? subcategoryData
        : (subcategoryData?.subcategory || subcategoryData?.data?.subcategory || subcategoryData?.subcategories || subcategoryData?.data || []);
      const categoryRows = Array.isArray(categoryData) ? categoryData : (categoryData?.category || categoryData?.data?.category || categoryData?.data || []);
      const categoryById = new Map(categoryRows.map(category => [String(category.id ?? category.category_id), category]));
      setCategories(categoryRows);
      setRows(subcategories.map(row => {
        const rawCategory = row.category_id ?? row.categoryId ?? row.category ?? row.Category;
        const categoryId = rawCategory && typeof rawCategory === 'object'
          ? (rawCategory.id ?? rawCategory.category_id ?? rawCategory.value)
          : rawCategory;
        const category = (categoryId != null ? categoryById.get(String(categoryId)) : null)
          || (rawCategory && typeof rawCategory === 'object' ? rawCategory : null)
          || (typeof rawCategory === 'string' ? categoryRows.find(item => String(item.name || item.category_name || '').trim().toLowerCase() === rawCategory.trim().toLowerCase()) : null);
        return {
          ...row,
          category_id: categoryId ?? null,
          category_name: row.category_name || row.categoryName || category?.name || category?.category_name || (typeof rawCategory === 'string' && Number.isNaN(Number(rawCategory)) ? rawCategory : ''),
        };
      }));
    } catch (error) {
      showToast('Load Failed', error.message || 'Could not load subcategories.');
    } finally {
      setLoading(false);
    }
  };

  const categoryName = (row) => row.category_name || row.category?.name || row.Category?.name
    || categories.find(category => String(category.id ?? category.category_id) === String(row.category_id ?? row.categoryId))?.name
    || (row.category_id != null ? `Category #${row.category_id}` : '—');

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Subcategories</div>
        <span style={{ color: '#64748b', fontSize: 12 }}>Synced from Billing</span>
      </div>

      {loading ? <p className="km-loading">Loading subcategories...</p> : (
        <DataTable
          columns={['ID', 'Category', 'Subcategory', 'Status']}
          initialRows={rows}
          renderRow={row => (
            <tr key={row.id}>
              <td className="td-id">#{row.id}</td>
              <td><span className="status-pill pill-approved">{categoryName(row)}</span></td>
              <td className="td-strong">{row.name}</td>
              <td><span className={`status-pill ${pillClass[row.status] || 'pill-inactive'}`}>{row.status || 'Active'}</span></td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
