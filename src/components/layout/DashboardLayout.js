/**
 * Dashboard Layout Component
 * 
 * Layout wrapper for dashboard pages with header, sidebar, and content area
 */

import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Header />
      <div className="dashboard-content-wrapper">
        <Sidebar />
        <main className="dashboard-main">
          <div className="dashboard-container">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardLayout;






