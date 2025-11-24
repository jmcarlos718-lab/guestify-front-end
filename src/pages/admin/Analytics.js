/**
 * Admin Analytics Page
 * 
 * Analytics dashboard with charts and statistics
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { formatCurrency } from '../../utils/helpers';
import './Analytics.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeHosts: 0,
    activeGuests: 0
  });

  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    // TODO: Implement actual analytics data fetching
    setLoading(true);
    setTimeout(() => {
      setStats({
        totalUsers: 1250,
        totalListings: 342,
        totalBookings: 1890,
        totalRevenue: 125000,
        activeHosts: 89,
        activeGuests: 1161
      });
      setLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Loading fullScreen message="Loading analytics..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="analytics-page">
        <div className="analytics-header">
          <div>
            <h1>Analytics Dashboard</h1>
            <p>Platform insights and statistics</p>
          </div>
          <div className="time-range-selector">
            <button
              className={`time-btn ${timeRange === '7days' ? 'active' : ''}`}
              onClick={() => setTimeRange('7days')}
            >
              7 Days
            </button>
            <button
              className={`time-btn ${timeRange === '30days' ? 'active' : ''}`}
              onClick={() => setTimeRange('30days')}
            >
              30 Days
            </button>
            <button
              className={`time-btn ${timeRange === '90days' ? 'active' : ''}`}
              onClick={() => setTimeRange('90days')}
            >
              90 Days
            </button>
            <button
              className={`time-btn ${timeRange === 'all' ? 'active' : ''}`}
              onClick={() => setTimeRange('all')}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <Card className="metric-card">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <h3 className="metric-value">{stats.totalUsers.toLocaleString()}</h3>
              <p className="metric-label">Total Users</p>
              <span className="metric-change positive">+12% from last period</span>
            </div>
          </Card>

          <Card className="metric-card">
            <div className="metric-icon">🏠</div>
            <div className="metric-content">
              <h3 className="metric-value">{stats.totalListings.toLocaleString()}</h3>
              <p className="metric-label">Total Listings</p>
              <span className="metric-change positive">+8% from last period</span>
            </div>
          </Card>

          <Card className="metric-card">
            <div className="metric-icon">📋</div>
            <div className="metric-content">
              <h3 className="metric-value">{stats.totalBookings.toLocaleString()}</h3>
              <p className="metric-label">Total Bookings</p>
              <span className="metric-change positive">+15% from last period</span>
            </div>
          </Card>

          <Card className="metric-card">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <h3 className="metric-value">{formatCurrency(stats.totalRevenue)}</h3>
              <p className="metric-label">Platform Revenue</p>
              <span className="metric-change positive">+22% from last period</span>
            </div>
          </Card>
        </div>

        {/* User Breakdown */}
        <div className="analytics-sections">
          <Card title="User Breakdown" className="analytics-card">
            <div className="user-breakdown">
              <div className="breakdown-item">
                <div className="breakdown-label">Active Hosts</div>
                <div className="breakdown-value">{stats.activeHosts}</div>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill"
                    style={{ width: `${(stats.activeHosts / stats.totalUsers) * 100}%` }}
                  />
                </div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label">Active Guests</div>
                <div className="breakdown-value">{stats.activeGuests}</div>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill"
                    style={{ width: `${(stats.activeGuests / stats.totalUsers) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Top Performing Listings" className="analytics-card">
            <div className="top-listings">
              <div className="top-listing-item">
                <span className="ranking">1</span>
                <div className="listing-info">
                  <strong>Beautiful Downtown Apartment</strong>
                  <span>45 bookings • $12,450 revenue</span>
                </div>
              </div>
              <div className="top-listing-item">
                <span className="ranking">2</span>
                <div className="listing-info">
                  <strong>Cozy Mountain Cabin</strong>
                  <span>38 bookings • $9,800 revenue</span>
                </div>
              </div>
              <div className="top-listing-item">
                <span className="ranking">3</span>
                <div className="listing-info">
                  <strong>Beachfront Villa</strong>
                  <span>32 bookings • $15,200 revenue</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Reviews Analytics */}
        <Card title="Reviews Analytics" className="analytics-card">
          <div className="reviews-stats">
            <div className="review-stat">
              <div className="stat-label">Average Rating</div>
              <div className="stat-value-large">4.7</div>
              <div className="stat-stars">★★★★★</div>
            </div>
            <div className="review-stat">
              <div className="stat-label">Total Reviews</div>
              <div className="stat-value">1,234</div>
            </div>
            <div className="review-stat">
              <div className="stat-label">5-Star Reviews</div>
              <div className="stat-value">892 (72%)</div>
            </div>
            <div className="review-stat">
              <div className="stat-label">Lowest Rated</div>
              <div className="stat-value">2.1</div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;





