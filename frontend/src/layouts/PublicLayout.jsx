import { useState } from 'react';
import { useLocation, Link, Outlet } from 'react-router-dom';
import ErrorBoundary from '../components/ui/ErrorBoundary';

import './PublicLayout.css';

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const NavLinkItem = ({ to, label }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to + '/'));
    return (
        <Link 
            to={to} 
            className={`public-nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
        >
            {label}
        </Link>
    );
  };

  return (
    <ErrorBoundary>
    <div className="public-layout">
      {location.pathname !== '/' && (
        <header className="public-header">
          <div className="public-brand">
            <div className="public-brand-dot"></div>
            <h1 className="public-brand-text">Aurelian Health</h1>
          </div>
        </header>
      )}



      <main className="public-main overflow-x-hidden">
        <Outlet />
      </main>
      {location.pathname !== '/' && (
        <footer className="public-footer">
          <p>&copy; 2026 Aurelian Health</p>
        </footer>
      )}
    </div>
    </ErrorBoundary>
  );
};

export default PublicLayout;
