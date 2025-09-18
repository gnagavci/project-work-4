// Navigation header component with active route highlighting
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Header component with application branding and navigation
function Header() {
  // Get current route for active link styling
  const location = useLocation();

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Application logo and branding */}
          <h1 className="logo" style={{ fontStyle: 'italic' }}>Agentarium</h1>
          {/* Main navigation menu */}
          <nav className="nav">
            {/* Dashboard link with active state detection */}
            <Link
              to="/"
              className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
            >
              Dashboard
            </Link>
            {/* Create simulation link with active state detection */}
            <Link
              to="/create"
              className={location.pathname === '/create' ? 'nav-link active' : 'nav-link'}
            >
              Create Simulation
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;