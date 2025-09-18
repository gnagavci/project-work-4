// Dashboard page component for viewing and filtering simulations
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Table from '../components/Table.jsx';
import Pagination from '../components/Pagination.jsx';

// API endpoint configuration from environment
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3002';

// Main dashboard component with filtering and real-time updates
function Dashboard() {
  // URL-based state management for filters and pagination
  const [searchParams, setSearchParams] = useSearchParams();
  // Component state for simulations data and UI
  const [simulations, setSimulations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  // Refs for managing timers and loading states
  const debounceRef = useRef(null);
  const intervalRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Extract current filter values from URL parameters
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const currentLimit = parseInt(searchParams.get('limit')) || 10;
  const currentStatus = searchParams.get('status') || '';
  const currentBehavior = searchParams.get('behavior') || '';
  const currentSort = searchParams.get('sort') || 'created_at';
  const currentOrder = searchParams.get('order') || 'desc';
  const currentQ = searchParams.get('q') || '';

  // Update URL parameters with new filter values
  const updateSearchParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    // Apply parameter updates or remove empty values
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    // Reset pagination when filters change
    if (!updates.hasOwnProperty('page')) {
      newParams.set('page', '1');
      // Show loading state for filter changes
      isInitialLoad.current = true;
      setInitialLoading(true);
    }
    setSearchParams(newParams);
  };

  // Fetch simulations from API with current filter parameters
  const fetchSimulations = async (signal) => {
    try {
      // Build query parameters from current state
      const params = new URLSearchParams({
        page: currentPage,
        limit: currentLimit,
        sort: currentSort,
        order: currentOrder
      });

      // Add optional filter parameters
      if (currentQ) params.append('q', currentQ);
      if (currentStatus) params.append('status', currentStatus);
      if (currentBehavior) params.append('behavior', currentBehavior);

      // Make API request and update state
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
      if (isInitialLoad.current) {
        setInitialLoading(false);
        isInitialLoad.current = false;
      }
    }
  };

  // Handle search input with debouncing to prevent excessive API calls
  const handleSearchChange = (value) => {
    setSearchInput(value);
    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // Set new debounce timer for 300ms delay
    debounceRef.current = setTimeout(() => {
      isInitialLoad.current = true;
      setInitialLoading(true);
      updateSearchParams({ q: value });
    }, 300);
  };

  // Set up automatic data fetching and real-time updates
  useEffect(() => {
    const controller = new AbortController();

    // Initial data fetch
    fetchSimulations(controller.signal);

    // Start polling for real-time updates
    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Poll every 2 seconds when page is visible
      intervalRef.current = setInterval(() => {
        if (!document.hidden) {
          fetchSimulations(controller.signal);
        }
      }, 2000);
    };

    // Stop polling when component unmounts or page becomes hidden
    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    // Handle browser tab visibility changes for efficient polling
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
        {/* Filter and search controls */}
        <div className="dashboard-controls">
          {/* Search input with real-time filtering */}
          <div className="control-group">
            <input
              type="text"
              placeholder="Search simulations..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Status filter dropdown */}
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

      {/* Loading indicator for initial page load */}
      {initialLoading && simulations.length === 0 && <div className="loading">Loading...</div>}

      {/* Simulations data table */}
      <Table simulations={simulations} />

      {/* Pagination controls */}
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