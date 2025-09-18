// Data table component for displaying simulation records
import React from 'react';
import Badge from './Badge.jsx';

// Table component with formatted display of simulation data
function Table({ simulations }) {
  // Format timestamp strings to user-friendly date display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Format simulation result object for table display
  const formatResult = (result) => {
    if (!result) return '—';

    // Display structured metrics if available
    if (result.ok && result.metrics) {
      const { echoRuns, echoAgentCount, advancedProvided } = result.metrics;
      return `Runs: ${echoRuns}, Agents: ${echoAgentCount}, Advanced: ${advancedProvided}`;
    }

    // Fallback to JSON string for unknown result formats
    return JSON.stringify(result);
  };

  // Truncate UUID to first 8 characters for compact display
  const shortenId = (id) => {
    return id.substring(0, 8);
  };

  // Show empty state when no simulations are available
  if (simulations.length === 0) {
    return (
      <div className="empty-state">
        <h3>No simulations found</h3>
        <p>Create your first simulation to get started!</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      {/* Responsive table with simulation data */}
      <table className="simulations-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Behavior</th>
            <th>Runs</th>
            <th>Agents</th>
            <th>Status</th>
            <th>Created</th>
            <th>Updated</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {/* Render each simulation as a table row */}
          {simulations.map((sim) => (
            <tr key={sim.id}>
              {/* Shortened ID with full ID in tooltip */}
              <td className="id-cell" title={sim.id}>
                {shortenId(sim.id)}
              </td>
              <td className="name-cell">{sim.name}</td>
              <td>
                <span className="behavior-tag">{sim.behavior}</span>
              </td>
              <td>{sim.runs}</td>
              <td>{sim.agentCount}</td>
              {/* Status with colored badge component */}
              <td>
                <Badge status={sim.status} />
              </td>
              <td className="date-cell">{formatDate(sim.createdAt)}</td>
              <td className="date-cell">{formatDate(sim.updatedAt)}</td>
              {/* Formatted result metrics */}
              <td className="result-cell">
                {formatResult(sim.result)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;