import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateSimulation from './pages/CreateSimulation.jsx';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="container">
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