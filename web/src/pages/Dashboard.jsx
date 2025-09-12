import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Table from '../components/Table.jsx';
import Pagination from '../components/Pagination.jsx';


const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const debounceRef = useRef(null);
  const intervalRef = useRef(null);

  // Current filter state
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const currentLimit = parseInt(searchParams.get('limit')) || 10;
  const currentStatus = searchParams.get('status') || '';
  const currentBehavior = searchParams.get('behavior') || '';
  const currentSort = searchParams.get('sort') || 'created_at';
  const currentOrder = searchParams.get('order') || 'desc';
  const currentQ = searchParams.get('q') || '';

  const updateSearchParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    // Reset to page 1 when filters change (except when updating page itself)
    if (!updates.hasOwnProperty('page')) {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const fetchSimulations = async (signal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: currentLimit,
        sort: currentSort,
        order: currentOrder
      });

      if (currentQ) params.append('q', currentQ);
      if (currentStatus) params.append('status', currentStatus);
      if (currentBehavior) params.append('behavior', currentBehavior);

      const response = await fetch(`${API_BASE}/api/simulations?${params}`, { signal });
      if (response.ok) {
        const data = await response.json();
        setSimulations(data.items);
        setTotal(data.total);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching simulations:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      updateSearchParams({ q: value });
    }, 300);
  };

  // Auto-refresh with visibility API
  useEffect(() => {
    const controller = new AbortController();
    
    fetchSimulations(controller.signal);
    
    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchSimulations(controller.signal);
        }
      }, 2000);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      controller.abort();
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [currentPage, currentLimit, currentStatus, currentBehavior, currentSort, currentOrder, currentQ]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Simulation Dashboard</h1>
        <div className="dashboard-controls">
          <div className="control-group">
            <input
              type="text"
              placeholder="Search simulations..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="control-group">
            <label>Status:</label>
            <select
              value={currentStatus}
              onChange={(e) => updateSearchParams({ status: e.target.value })}
            >
              <option value="">All</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="done">Done</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="control-group">
            <label>Behavior:</label>
            <select
              value={currentBehavior}
              onChange={(e) => updateSearchParams({ behavior: e.target.value })}
            >
              <option value="">All</option>
              <option value="None">None</option>
              <option value="Random">Random</option>
              <option value="Directed">Directed</option>
              <option value="Collective">Collective</option>
              <option value="Flow">Flow</option>
            </select>
          </div>

          <div className="control-group">
            <label>Sort:</label>
            <select
              value={`${currentSort}-${currentOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                updateSearchParams({ sort, order });
              }}
            >
              <option value="created_at-desc">Newest</option>
              <option value="created_at-asc">Oldest</option>
              <option value="updated_at-desc">Recently Updated</option>
              <option value="updated_at-asc">Least Recently Updated</option>
            </select>
          </div>

          <div className="control-group">
            <label>Page Size:</label>
            <select
              value={currentLimit}
              onChange={(e) => updateSearchParams({ limit: e.target.value })}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}
      
      <Table simulations={simulations} />
      
      <Pagination
        currentPage={currentPage}
        totalItems={total}
        itemsPerPage={currentLimit}
        onPageChange={(page) => updateSearchParams({ page })}
      />
    </div>
  );
}

export default Dashboard;