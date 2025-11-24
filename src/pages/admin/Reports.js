/**
 * Admin Reports Page
 * 
 * Generate and view platform reports
 */

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';
import './Reports.css';

const Reports = () => {
  const [reportType, setReportType] = useState('bookings');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [generating, setGenerating] = useState(false);

  const reportTypes = [
    { value: 'bookings', label: 'Bookings Report', description: 'All booking transactions' },
    { value: 'users', label: 'Users Report', description: 'User registrations and activity' },
    { value: 'listings', label: 'Listings Report', description: 'Listing performance and status' },
    { value: 'revenue', label: 'Revenue Report', description: 'Platform revenue and fees' },
    { value: 'reviews', label: 'Reviews Report', description: 'User reviews and ratings' }
  ];

  const handleGenerateReport = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    setGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      toast.success('Report generated successfully!');
      setGenerating(false);
      // In real implementation, this would download or display the report
    }, 2000);
  };

  const handleExport = (format) => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
    // In real implementation, this would export the report
  };

  return (
    <DashboardLayout>
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <h1>Reports</h1>
            <p>Generate and export platform reports</p>
          </div>
        </div>

        <div className="reports-content">
          {/* Report Configuration */}
          <Card title="Generate Report" className="report-config-card">
            <div className="report-form">
              <div className="form-group">
                <label className="form-label">Report Type</label>
                <div className="report-type-options">
                  {reportTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      className={`report-type-btn ${reportType === type.value ? 'active' : ''}`}
                      onClick={() => setReportType(type.value)}
                    >
                      <div className="report-type-header">
                        <strong>{type.label}</strong>
                      </div>
                      <div className="report-type-desc">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <Input
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  fullWidth
                />
                <Input
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  fullWidth
                />
              </div>

              <div className="form-actions">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGenerateReport}
                  loading={generating}
                  disabled={generating}
                >
                  Generate Report
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent Reports */}
          <Card title="Recent Reports" className="reports-list-card">
            <div className="reports-list">
              <div className="report-item">
                <div className="report-info">
                  <div className="report-name">
                    <strong>Bookings Report</strong>
                    <span className="report-date">Generated on {formatDate(new Date())}</span>
                  </div>
                  <div className="report-details">
                    <span>Period: Jan 1 - Jan 31, 2024</span>
                    <span>Records: 1,234</span>
                  </div>
                </div>
                <div className="report-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('pdf')}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('csv')}
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('excel')}
                  >
                    Excel
                  </Button>
                </div>
              </div>

              <div className="report-item">
                <div className="report-info">
                  <div className="report-name">
                    <strong>Users Report</strong>
                    <span className="report-date">Generated on {formatDate(new Date(Date.now() - 86400000))}</span>
                  </div>
                  <div className="report-details">
                    <span>Period: Dec 1 - Dec 31, 2023</span>
                    <span>Records: 856</span>
                  </div>
                </div>
                <div className="report-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('pdf')}
                  >
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('csv')}
                  >
                    CSV
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Report Templates */}
          <Card title="Quick Reports" className="quick-reports-card">
            <div className="quick-reports">
              <button className="quick-report-btn">
                <span className="quick-report-icon">📊</span>
                <div>
                  <strong>Today's Bookings</strong>
                  <span>View today's booking activity</span>
                </div>
              </button>
              <button className="quick-report-btn">
                <span className="quick-report-icon">💰</span>
                <div>
                  <strong>Monthly Revenue</strong>
                  <span>Current month revenue summary</span>
                </div>
              </button>
              <button className="quick-report-btn">
                <span className="quick-report-icon">👥</span>
                <div>
                  <strong>New Users</strong>
                  <span>Users registered this week</span>
                </div>
              </button>
              <button className="quick-report-btn">
                <span className="quick-report-icon">⭐</span>
                <div>
                  <strong>Top Listings</strong>
                  <span>Best performing listings</span>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;





