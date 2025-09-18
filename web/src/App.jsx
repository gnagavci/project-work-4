// Main React application component with routing
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateSimulation from './pages/CreateSimulation.jsx';

// Root application component with client-side routing
function App() {
  return (
    <Router>
      <div className="app">
        {/* Global navigation header */}
        <Header />
        <main className="container">
          {/* Route definitions for different pages */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateSimulation />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;