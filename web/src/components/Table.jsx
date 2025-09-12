import React from 'react';
import Badge from './Badge.jsx';

function Table({ simulations }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatResult = (result) => {
    if (!result) return '—';
    
    if (result.ok && result.metrics) {
      const { echoRuns, echoAgentCount, advancedProvided } = result.metrics;
      return `Runs: ${echoRuns}, Agents: ${echoAgentCount}, Advanced: ${advancedProvided}`;
    }
    
    return JSON.stringify(result);
  };

  const shortenId = (id) => {
    return id.substring(0, 8);
  };

  if (simulations.length === 0) {
    return (
      <div className="empty-state">
        <p>No simulations found.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
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
          {simulations.map((sim) => (
            <tr key={sim.id}>
              <td className="id-cell" title={sim.id}>
                {shortenId(sim.id)}
              </td>
              <td className="name-cell">{sim.name}</td>
              <td>
                <span className="behavior-tag">{sim.behavior}</span>
              </td>
              <td>{sim.runs}</td>
              <td>{sim.agentCount}</td>
              <td>
                <Badge status={sim.status} />
              </td>
              <td className="date-cell">{formatDate(sim.createdAt)}</td>
              <td className="date-cell">{formatDate(sim.updatedAt)}</td>
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