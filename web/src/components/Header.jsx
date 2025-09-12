import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1 className="logo">Simulation Dashboard</h1>
          <nav className="nav">
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
            >
              Dashboard
            </Link>
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