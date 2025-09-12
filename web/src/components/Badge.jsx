import React from 'react';

function Badge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {status}
    </span>
  );
}

export default Badge;