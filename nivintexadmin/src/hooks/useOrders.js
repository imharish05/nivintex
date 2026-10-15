import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BASE_URL = `${process.env.REACT_APP_API_URL}/orders`;

const useOrders = (endpoint) => {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [keyword, setKeyword]   = useState('');
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/${endpoint}`, {
        params: { keyword, page, limit: 10 },
      });
      setOrders(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, keyword, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id, deliveryStatus) => {
    await axios.put(`${BASE_URL}/${id}/delivery-status`, { deliveryStatus });
    fetchOrders();
  };

  return {
    orders, loading, keyword, setKeyword,
    page, setPage, totalPages, updateStatus, fetchOrders,
  };
};

export default useOrders;