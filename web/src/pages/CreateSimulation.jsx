import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function CreateSimulation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    behavior: 'None',
    runs: 1,
    agentCount: 10,
    seed: '',
    speed: '',
    cohesion: '',
    separation: '',
    alignment: '',
    noise: '',
    steps: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.behavior) {
      newErrors.behavior = 'Behavior is required';
    }
    
    if (!formData.runs || formData.runs < 1) {
      newErrors.runs = 'Runs must be at least 1';
    }
    
    if (!formData.agentCount || formData.agentCount < 1) {
      newErrors.agentCount = 'Agent count must be at least 1';
    }

    // Validate optional numeric fields
    const numericFields = ['seed', 'speed', 'cohesion', 'separation', 'alignment', 'noise', 'steps'];
    numericFields.forEach(field => {
      if (formData[field] && isNaN(Number(formData[field]))) {
        newErrors[field] = `${field} must be a valid number`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');

    try {
      // Prepare payload with proper types
      const payload = {
        name: formData.name.trim(),
        behavior: formData.behavior,
        runs: parseInt(formData.runs),
        agentCount: parseInt(formData.agentCount)
      };

      // Add optional fields if provided
      if (formData.seed) payload.seed = parseInt(formData.seed);
      if (formData.speed) payload.speed = parseFloat(formData.speed);
      if (formData.cohesion) payload.cohesion = parseFloat(formData.cohesion);
      if (formData.separation) payload.separation = parseFloat(formData.separation);
      if (formData.alignment) payload.alignment = parseFloat(formData.alignment);
      if (formData.noise) payload.noise = parseFloat(formData.noise);
      if (formData.steps) payload.steps = parseInt(formData.steps);

      const response = await fetch(`${API_BASE}/api/simulations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessMessage('Simulation created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/?highlight=' + Date.now());
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to create simulation' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-simulation">
      <h1>Create New Simulation</h1>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="simulation-form">
        {/* Basics Section */}
        <section className="form-section">
          <h2>Basic Parameters</h2>
          
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
              placeholder="Enter simulation name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="behavior">Behavior *</label>
            <select
              id="behavior"
              name="behavior"
              value={formData.behavior}
              onChange={handleChange}
              className={errors.behavior ? 'error' : ''}
            >
              <option value="None">None</option>
              <option value="Random">Random</option>
              <option value="Directed">Directed</option>
              <option value="Collective">Collective</option>
              <option value="Flow">Flow</option>
            </select>
            {errors.behavior && <span className="error-message">{errors.behavior}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="runs">Runs *</label>
              <input
                type="number"
                id="runs"
                name="runs"
                value={formData.runs}
                onChange={handleChange}
                min="1"
                className={errors.runs ? 'error' : ''}
              />
              {errors.runs && <span className="error-message">{errors.runs}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="agentCount">Agent Count *</label>
              <input
                type="number"
                id="agentCount"
                name="agentCount"
                value={formData.agentCount}
                onChange={handleChange}
                min="1"
                className={errors.agentCount ? 'error' : ''}
              />
              {errors.agentCount && <span className="error-message">{errors.agentCount}</span>}
            </div>
          </div>
        </section>

        {/* Randomization Section */}
        <section className="form-section">
          <h2>Randomization</h2>
          
          <div className="form-group">
            <label htmlFor="seed">Seed (optional)</label>
            <input
              type="number"
              id="seed"
              name="seed"
              value={formData.seed}
              onChange={handleChange}
              className={errors.seed ? 'error' : ''}
              placeholder="Random seed for reproducibility"
            />
            {errors.seed && <span className="error-message">{errors.seed}</span>}
          </div>
        </section>

        {/* Advanced Parameters Section */}
        <section className="form-section">
          <h2>
            <button
              type="button"
              className="collapsible-header"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              Advanced Parameters {showAdvanced ? '▼' : '▶'}
            </button>
          </h2>
          
          {showAdvanced && (
            <div className="advanced-params">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="speed">Speed</label>
                  <input
                    type="number"
                    id="speed"
                    name="speed"
                    value={formData.speed}
                    onChange={handleChange}
                    step="0.1"
                    className={errors.speed ? 'error' : ''}
                    placeholder="Movement speed"
                  />
                  {errors.speed && <span className="error-message">{errors.speed}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="cohesion">Cohesion</label>
                  <input
                    type="number"
                    id="cohesion"
                    name="cohesion"
                    value={formData.cohesion}
                    onChange={handleChange}
                    step="0.1"
                    className={errors.cohesion ? 'error' : ''}
                    placeholder="Attraction strength"
                  />
                  {errors.cohesion && <span className="error-message">{errors.cohesion}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="separation">Separation</label>
                  <input
                    type="number"
                    id="separation"
                    name="separation"
                    value={formData.separation}
                    onChange={handleChange}
                    step="0.1"
                    className={errors.separation ? 'error' : ''}
                    placeholder="Repulsion strength"
                  />
                  {errors.separation && <span className="error-message">{errors.separation}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="alignment">Alignment</label>
                  <input
                    type="number"
                    id="alignment"
                    name="alignment"
                    value={formData.alignment}
                    onChange={handleChange}
                    step="0.1"
                    className={errors.alignment ? 'error' : ''}
                    placeholder="Direction matching"
                  />
                  {errors.alignment && <span className="error-message">{errors.alignment}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="noise">Noise</label>
                  <input
                    type="number"
                    id="noise"
                    name="noise"
                    value={formData.noise}
                    onChange={handleChange}
                    step="0.1"
                    className={errors.noise ? 'error' : ''}
                    placeholder="Random variation"
                  />
                  {errors.noise && <span className="error-message">{errors.noise}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="steps">Steps</label>
                  <input
                    type="number"
                    id="steps"
                    name="steps"
                    value={formData.steps}
                    onChange={handleChange}
                    min="1"
                    className={errors.steps ? 'error' : ''}
                    placeholder="Simulation duration"
                  />
                  {errors.steps && <span className="error-message">{errors.steps}</span>}
                </div>
              </div>
            </div>
          )}
        </section>

        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Simulation'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateSimulation;