// Form component for creating new simulation requests
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// API endpoint configuration from environment
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3002';

// Main form component for simulation creation
function CreateSimulation() {
  const navigate = useNavigate();
  // Form state with default simulation parameters
  const [formData, setFormData] = useState({
    name: '',
    behavior: 'Random',
    runs: 1,
    agentCount: 50,
    seed: '',
    speed: 1.0,
    cohesion: 0.5,
    separation: 0.3,
    alignment: 0.4,
    noise: 0.1,
    steps: 1000,
    environment: 'Open',
    agentSize: 'Medium',
    simulationMode: 'Real-time'
  });

  // Component state for form validation and UI control
  const [errors, setErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Handle form input changes with error clearing
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field-specific error when user modifies input
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate all form fields and return validation status
  const validateForm = () => {
    const newErrors = {};

    // Validate required fields
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

    // Validate that numeric fields contain valid numbers
    const numericFields = ['seed', 'speed', 'cohesion', 'separation', 'alignment', 'noise', 'steps'];
    numericFields.forEach(field => {
      if (formData[field] !== '' && isNaN(Number(formData[field]))) {
        newErrors[field] = `${field} must be a valid number`;
      }
    });

    // Validate parameter ranges for simulation physics
    if (formData.speed && (formData.speed < 0.1 || formData.speed > 10)) {
      newErrors.speed = 'Speed must be between 0.1 and 10';
    }
    if (formData.cohesion && (formData.cohesion < 0 || formData.cohesion > 2)) {
      newErrors.cohesion = 'Cohesion must be between 0 and 2';
    }
    if (formData.separation && (formData.separation < 0 || formData.separation > 2)) {
      newErrors.separation = 'Separation must be between 0 and 2';
    }
    if (formData.alignment && (formData.alignment < 0 || formData.alignment > 2)) {
      newErrors.alignment = 'Alignment must be between 0 and 2';
    }
    if (formData.noise && (formData.noise < 0 || formData.noise > 1)) {
      newErrors.noise = 'Noise must be between 0 and 1';
    }
    if (formData.steps && (formData.steps < 10 || formData.steps > 10000)) {
      newErrors.steps = 'Steps must be between 10 and 10,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with validation and API call
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Stop submission if validation fails
    if (!validateForm()) {
      return;
    }

    // Set loading state and clear previous messages
    setSubmitting(true);
    setSuccessMessage('');

    try {
      // Build API payload with type conversion
      const payload = {
        name: formData.name.trim(),
        behavior: formData.behavior,
        runs: parseInt(formData.runs),
        agentCount: parseInt(formData.agentCount)
      };

      // Include optional advanced parameters if specified
      if (formData.seed) payload.seed = parseInt(formData.seed);
      if (formData.speed) payload.speed = parseFloat(formData.speed);
      if (formData.cohesion) payload.cohesion = parseFloat(formData.cohesion);
      if (formData.separation) payload.separation = parseFloat(formData.separation);
      if (formData.alignment) payload.alignment = parseFloat(formData.alignment);
      if (formData.noise) payload.noise = parseFloat(formData.noise);
      if (formData.steps) payload.steps = parseInt(formData.steps);

      // Send simulation creation request to API
      const response = await fetch(`${API_BASE}/api/simulations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Handle successful creation or display errors
      if (response.ok) {
        setSuccessMessage('Simulation created successfully! Redirecting to dashboard...');
        // Navigate back to dashboard after brief delay
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

      {/* Success message display */}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* Main simulation configuration form */}
      <form onSubmit={handleSubmit} className="simulation-form">
        {/* Core simulation parameters section */}
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="behavior">Behavior Pattern *</label>
              <select
                id="behavior"
                name="behavior"
                value={formData.behavior}
                onChange={handleChange}
                className={errors.behavior ? 'error' : ''}
              >
                <option value="Random">🎲 Random Walk</option>
                <option value="Flocking">🐦 Flocking (Boids)</option>
                <option value="Swarming">🐝 Swarming</option>
                <option value="Schooling">🐟 Schooling</option>
                <option value="Herding">🐑 Herding</option>
                <option value="Collective">🌊 Collective Motion</option>
                <option value="Directed">🎯 Directed Movement</option>
                <option value="Foraging">🔍 Foraging</option>
                <option value="Predator-Prey">🦁 Predator-Prey</option>
                <option value="Flow">💨 Flow Dynamics</option>
                <option value="None">⭕ No Behavior</option>
              </select>
              {errors.behavior && <span className="error-message">{errors.behavior}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="environment">Environment Type</label>
              <select
                id="environment"
                name="environment"
                value={formData.environment}
                onChange={handleChange}
              >
                <option value="Open">🌌 Open Space</option>
                <option value="Bounded">📦 Bounded Area</option>
                <option value="Toroidal">🍩 Toroidal (Wrapping)</option>
                <option value="Maze">🏗️ Maze Environment</option>
                <option value="Obstacles">🚧 With Obstacles</option>
                <option value="Gradient">🌈 Gradient Field</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="runs">Simulation Runs *</label>
              <select
                id="runs"
                name="runs"
                value={formData.runs}
                onChange={handleChange}
                className={errors.runs ? 'error' : ''}
              >
                <option value="1">1 run (Quick test)</option>
                <option value="3">3 runs (Basic analysis)</option>
                <option value="5">5 runs (Good statistics)</option>
                <option value="10">10 runs (Robust data)</option>
                <option value="20">20 runs (High confidence)</option>
                <option value="50">50 runs (Research grade)</option>
                <option value="100">100 runs (Publication quality)</option>
              </select>
              {errors.runs && <span className="error-message">{errors.runs}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="agentCount">Agent Population *</label>
              <select
                id="agentCount"
                name="agentCount"
                value={formData.agentCount}
                onChange={handleChange}
                className={errors.agentCount ? 'error' : ''}
              >
                <option value="10">10 agents (Minimal)</option>
                <option value="25">25 agents (Small group)</option>
                <option value="50">50 agents (Medium group)</option>
                <option value="100">100 agents (Large group)</option>
                <option value="250">250 agents (Swarm)</option>
                <option value="500">500 agents (Large swarm)</option>
                <option value="1000">1000 agents (Massive simulation)</option>
              </select>
              {errors.agentCount && <span className="error-message">{errors.agentCount}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="agentSize">Agent Size</label>
              <select
                id="agentSize"
                name="agentSize"
                value={formData.agentSize}
                onChange={handleChange}
              >
                <option value="Tiny">🔸 Tiny (0.5 units)</option>
                <option value="Small">🔹 Small (1.0 units)</option>
                <option value="Medium">🔷 Medium (1.5 units)</option>
                <option value="Large">🔶 Large (2.0 units)</option>
                <option value="Huge">🟦 Huge (3.0 units)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="simulationMode">Simulation Mode</label>
              <select
                id="simulationMode"
                name="simulationMode"
                value={formData.simulationMode}
                onChange={handleChange}
              >
                <option value="Real-time">⏱️ Real-time</option>
                <option value="Fast">⚡ Fast (2x speed)</option>
                <option value="Turbo">🚀 Turbo (5x speed)</option>
                <option value="Batch">📊 Batch Processing</option>
                <option value="Step-by-step">👟 Step-by-step</option>
              </select>
            </div>
          </div>
        </section>

        {/* Random seed and simulation duration controls */}
        <section className="form-section">
          <h2>Randomization & Duration</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="seed">Random Seed</label>
              <input
                type="number"
                id="seed"
                name="seed"
                value={formData.seed}
                onChange={handleChange}
                className={errors.seed ? 'error' : ''}
                placeholder="Leave empty for random seed"
              />
              <small style={{color: 'var(--gray-500)', fontSize: 'var(--font-size-xs)'}}>
                Use same seed for reproducible results
              </small>
              {errors.seed && <span className="error-message">{errors.seed}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="steps">Simulation Steps</label>
              <select
                id="steps"
                name="steps"
                value={formData.steps}
                onChange={handleChange}
                className={errors.steps ? 'error' : ''}
              >
                <option value="100">100 steps (Quick preview)</option>
                <option value="500">500 steps (Short simulation)</option>
                <option value="1000">1000 steps (Standard)</option>
                <option value="2500">2500 steps (Extended)</option>
                <option value="5000">5000 steps (Long-term)</option>
                <option value="10000">10000 steps (Research)</option>
              </select>
              {errors.steps && <span className="error-message">{errors.steps}</span>}
            </div>
          </div>
        </section>

        {/* Collapsible advanced physics parameters section */}
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
                  <label htmlFor="speed">Movement Speed: {formData.speed}</label>
                  <input
                    type="range"
                    id="speed"
                    name="speed"
                    value={formData.speed}
                    onChange={handleChange}
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    className={errors.speed ? 'error' : ''}
                  />
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)'}}>
                    <span>0.1 (Slow)</span>
                    <span>5.0 (Fast)</span>
                  </div>
                  {errors.speed && <span className="error-message">{errors.speed}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="noise">Randomness: {formData.noise}</label>
                  <input
                    type="range"
                    id="noise"
                    name="noise"
                    value={formData.noise}
                    onChange={handleChange}
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    className={errors.noise ? 'error' : ''}
                  />
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)'}}>
                    <span>0.0 (Predictable)</span>
                    <span>1.0 (Chaotic)</span>
                  </div>
                  {errors.noise && <span className="error-message">{errors.noise}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cohesion">Cohesion Force: {formData.cohesion}</label>
                  <input
                    type="range"
                    id="cohesion"
                    name="cohesion"
                    value={formData.cohesion}
                    onChange={handleChange}
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    className={errors.cohesion ? 'error' : ''}
                  />
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)'}}>
                    <span>0.0 (No attraction)</span>
                    <span>2.0 (Strong attraction)</span>
                  </div>
                  {errors.cohesion && <span className="error-message">{errors.cohesion}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="separation">Separation Force: {formData.separation}</label>
                  <input
                    type="range"
                    id="separation"
                    name="separation"
                    value={formData.separation}
                    onChange={handleChange}
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    className={errors.separation ? 'error' : ''}
                  />
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)'}}>
                    <span>0.0 (No repulsion)</span>
                    <span>2.0 (Strong repulsion)</span>
                  </div>
                  {errors.separation && <span className="error-message">{errors.separation}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="alignment">Alignment Force: {formData.alignment}</label>
                  <input
                    type="range"
                    id="alignment"
                    name="alignment"
                    value={formData.alignment}
                    onChange={handleChange}
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    className={errors.alignment ? 'error' : ''}
                  />
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--gray-500)'}}>
                    <span>0.0 (No alignment)</span>
                    <span>2.0 (Strong alignment)</span>
                  </div>
                  {errors.alignment && <span className="error-message">{errors.alignment}</span>}
                </div>

                <div className="form-group">
                  <label>Quick Presets</label>
                  <div style={{display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap'}}>
                    <button type="button" className="btn btn-secondary" style={{padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-xs)'}} 
                      onClick={() => {
                        setFormData(prev => ({...prev, cohesion: 0.8, separation: 0.6, alignment: 0.7, speed: 1.2, noise: 0.05}));
                      }}>
                      🐦 Flocking
                    </button>
                    <button type="button" className="btn btn-secondary" style={{padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-xs)'}}
                      onClick={() => {
                        setFormData(prev => ({...prev, cohesion: 1.2, separation: 0.3, alignment: 0.9, speed: 0.8, noise: 0.1}));
                      }}>
                      🐟 Schooling
                    </button>
                    <button type="button" className="btn btn-secondary" style={{padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--font-size-xs)'}}
                      onClick={() => {
                        setFormData(prev => ({...prev, cohesion: 0.3, separation: 1.2, alignment: 0.2, speed: 2.0, noise: 0.3}));
                      }}>
                      🎲 Random
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {errors.submit && <div className="error-message">{errors.submit}</div>}

        {/* Form action buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
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