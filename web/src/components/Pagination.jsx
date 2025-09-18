// Pagination component for navigating through large datasets
import React from 'react';

// Pagination controls with page navigation and item count display
function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  // Calculate total number of pages needed
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Hide pagination if only one page or less
  if (totalPages <= 1) {
    return null;
  }

  // Calculate range of items shown on current page
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination">
      {/* Display current page item range and total count */}
      <div className="pagination-info">
        Showing {startItem}-{endItem} of {totalItems} results
      </div>

      {/* Navigation controls for page switching */}
      <div className="pagination-controls">
        {/* Previous page button with disabled state on first page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="pagination-btn"
        >
          Previous
        </button>

        {/* Current page indicator */}
        <span className="pagination-current">
          Page {currentPage} of {totalPages}
        </span>

        {/* Next page button with disabled state on last page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="pagination-btn"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;