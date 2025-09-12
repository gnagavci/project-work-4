import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    runs: 1,
    params: '{"alpha": 1}'
  });
  const [simulations, setSimulations] = useState([]);
  const [error, setError] = useState('');

  // Poll for simulations every 2 seconds
  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/simulations`);
        if (response.ok) {
          const data = await response.json();
          setSimulations(data);
        }
      } catch (err) {
        console.error('Error fetching simulations:', err);
      }
    };

    fetchSimulations();
    const interval = setInterval(fetchSimulations, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Validate JSON params
      JSON.parse(formData.params);
      
      const response = await fetch(`${API_BASE}/api/simulations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          runs: parseInt(formData.runs),
          params: JSON.parse(formData.params)
        }),
      });

      if (response.ok) {
        setFormData({
          name: '',
          runs: 1,
          params: '{"alpha": 1}'
        });
      } else {
        setError('Failed to submit simulation');
      }
    } catch (err) {
      setError('Invalid JSON in params field');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simulation Dashboard</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd' }}>
        <h2>Create New Simulation</h2>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            Runs:
            <input
              type="number"
              name="runs"
              value={formData.runs}
              onChange={handleInputChange}
              min="1"
              required
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label>
            Parameters (JSON):
            <br />
            <textarea
              name="params"
              value={formData.params}
              onChange={handleInputChange}
              rows="3"
              cols="50"
              style={{ marginTop: '5px', padding: '5px' }}
            />
          </label>
        </div>
        
        {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
          Submit Simulation
        </button>
      </form>

      <h2>Recent Simulations</h2>
      <div style={{ border: '1px solid #ddd', padding: '10px' }}>
        {simulations.length === 0 ? (
          <p>No simulations yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Status</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Created</th>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {simulations.map((sim) => (
                <tr key={sim.id}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{sim.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      backgroundColor: sim.status === 'done' ? '#d4edda' : '#fff3cd',
                      color: sim.status === 'done' ? '#155724' : '#856404'
                    }}>
                      {sim.status}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {new Date(sim.created_at).toLocaleString()}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {sim.result ? JSON.stringify(sim.result, null, 2) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default App;