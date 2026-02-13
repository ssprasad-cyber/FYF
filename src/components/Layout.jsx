import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, TrendingUp, Settings } from 'lucide-react';
import '../index.css';

const Layout = ({ children }) => {
    return (
        <div className="app-wrapper">
            <main className="container animate-fade-in">
                {children}
            </main>

            <nav className="bottom-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Home size={24} />
                    <span>Home</span>
                </NavLink>

                <NavLink to="/input" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <PlusCircle size={24} />
                    <span>Log</span>
                </NavLink>

                <NavLink to="/trends" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <TrendingUp size={24} />
                    <span>Trends</span>
                </NavLink>

                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Settings size={24} />
                    <span>Settings</span>
                </NavLink>
            </nav>

            <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: rgba(9, 9, 11, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          justify-content: space-around;
          padding: 0.75rem 0;
          z-index: 50;
          padding-bottom: env(safe-area-inset-bottom, 1rem);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.75rem;
          gap: 0.25rem;
          transition: color 0.2s;
        }

        .nav-item.active {
          color: var(--primary);
        }
      `}</style>
        </div>
    );
};

export default Layout;
