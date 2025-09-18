// Status badge component for simulation states
import React from 'react';

// Small badge component with status-specific styling
function Badge({ status }) {
  return (
    // Badge with dynamic CSS class based on status value
    <span className={`badge badge-${status}`}>
      {status}
    </span>
  );
}

export default Badge;