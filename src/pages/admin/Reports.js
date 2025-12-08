/**
 * Admin Reports Page
 *
 * Generate and print/export platform reports pulled from Firestore.
 */

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';
import * as firestoreService from '../../services/firestoreService';
import './Reports.css';

const Reports = () => {
  const [reportType, setReportType] = useState('bookings');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  const reportTypes = [
    { value: 'bookings', label: 'Bookings Report', description: 'All booking transactions' },
    { value: 'revenue', label: 'Revenue Report', description: 'Platform revenue and fees' },
    { value: 'users', label: 'Users Report', description: 'User registrations and activity' },
    { value: 'listings', label: 'Listings Report', description: 'Listing performance and status' }
  ];

  const ensureDates = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select start and end dates');
      return null;
    }
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const handleGenerateReport = async () => {
    const ranges = ensureDates();
    if (!ranges) return;

    setLoading(true);
    try {
      let data = [];
      if (reportType === 'bookings') {
        data = await loadBookings(ranges);
      } else if (reportType === 'revenue') {
        data = await loadPayments(ranges);
      } else if (reportType === 'users') {
        data = await loadUsers(ranges);
      } else if (reportType === 'listings') {
        data = await loadListings(ranges);
      }
      setReportData(data);
      toast.success(`Generated ${data.length} records`);
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(error.message || 'Unable to generate report');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async ({ start, end }) => {
    const bookings = await firestoreService.getDocuments('bookings', [], null, 'asc');
    return bookings
      .filter((b) => {
        const created = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return created >= start && created <= end;
      })
      .map((b) => ({
        id: b.id,
        guestId: b.guestId,
        hostId: b.hostId,
        total: b.pricing?.total || 0,
        currency: b.pricing?.currency || 'PHP',
        status: b.status,
        createdAt: b.createdAt
      }));
  };

  const loadPayments = async ({ start, end }) => {
    const payments = await firestoreService.getDocuments('payments', [], null, 'asc');
    return payments
      .filter((p) => {
        const created = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt || 0);
        return created >= start && created <= end;
      })
      .map((p) => ({
        id: p.id,
        amount: p.amount,
        adminIncome: p.adminIncome,
        hostIncome: p.hostIncome,
        status: p.status,
        payoutStatus: p.adminPayoutStatus || p.payoutStatus,
        createdAt: p.createdAt,
        currency: p.currency || 'PHP'
      }));
  };

  const loadUsers = async ({ start, end }) => {
    const users = await firestoreService.getDocuments('users', [], null, 'asc');
    return users.filter((u) => {
      const created = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt || 0);
      return created >= start && created <= end;
    });
  };

  const loadListings = async ({ start, end }) => {
    const listings = await firestoreService.getDocuments('listings', [], null, 'asc');
    return listings.filter((l) => {
      const created = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(l.createdAt || 0);
      return created >= start && created <= end;
    });
  };

  const handleExport = (format) => {
    if (!reportData.length) {
      toast.error('No data to export yet.');
      return;
    }

    const headers = columnConfig.map((c) => c.label);
    const rows = reportData.map((row) =>
      columnConfig
        .map((c) => {
          const value = typeof c.format === 'function' ? c.format(row) : row[c.key];
          return `"${String(value ?? '')}"`;
        })
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportType}-report.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${reportData.length} rows as ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    if (!reportData.length) {
      toast.error('No data to print.');
      return;
    }
    const win = window.open('', 'PRINT', 'height=900,width=900');
    if (!win) return;

    const rows = reportData
      .map((row) => {
        const cells = columnConfig
          .map((c) => `<td>${typeof c.format === 'function' ? c.format(row) : row[c.key] ?? ''}</td>`)
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    win.document.write(`
      <html>
        <head>
          <title>${reportTypes.find((r) => r.value === reportType)?.label || 'Report'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>${reportTypes.find((r) => r.value === reportType)?.label || 'Report'}</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>${columnConfig.map((c) => `<th>${c.label}</th>`).join('')}</tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const columnConfig = useMemo(() => {
    if (reportType === 'bookings') {
      return [
        { key: 'id', label: 'Booking' },
        { key: 'guestId', label: 'Guest' },
        { key: 'hostId', label: 'Host' },
        { key: 'total', label: 'Total', format: (row) => formatCurrency(row.total, row.currency) },
        { key: 'status', label: 'Status' },
        {
          key: 'createdAt',
          label: 'Created',
          format: (row) =>
            formatDate(row.createdAt?.toDate ? row.createdAt.toDate() : row.createdAt || new Date())
        }
      ];
    }

    if (reportType === 'revenue') {
      return [
        { key: 'id', label: 'Payment' },
        { key: 'amount', label: 'Total', format: (row) => formatCurrency(row.amount, row.currency) },
        {
          key: 'adminIncome',
          label: 'Admin Income',
          format: (row) => formatCurrency(row.adminIncome, row.currency)
        },
        {
          key: 'hostIncome',
          label: 'Host Income',
          format: (row) => formatCurrency(row.hostIncome, row.currency)
        },
        { key: 'payoutStatus', label: 'Payout Status' },
        {
          key: 'createdAt',
          label: 'Date',
          format: (row) =>
            formatDate(row.createdAt?.toDate ? row.createdAt.toDate() : row.createdAt || new Date())
        }
      ];
    }

    if (reportType === 'users') {
      return [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status' },
        {
          key: 'createdAt',
          label: 'Joined',
          format: (row) =>
            formatDate(row.createdAt?.toDate ? row.createdAt.toDate() : row.createdAt || new Date())
        }
      ];
    }

    return [
      { key: 'title', label: 'Title' },
      { key: 'hostId', label: 'Host' },
      { key: 'status', label: 'Status' },
      { key: 'price', label: 'Price' },
      {
        key: 'createdAt',
        label: 'Created',
        format: (row) =>
          formatDate(row.createdAt?.toDate ? row.createdAt.toDate() : row.createdAt || new Date())
      }
    ];
  }, [reportType]);

  return (
    <DashboardLayout>
      <div className="reports-page">
        <div className="reports-header">
          <div>
            <h1>Reports</h1>
            <p>Generate, print, and export platform reports</p>
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
                  onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                  fullWidth
                />
                <Input
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                  fullWidth
                />
              </div>

              <div className="form-actions">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleGenerateReport}
                  loading={loading}
                  disabled={loading}
                >
                  Generate Report
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePrint}
                  disabled={!reportData.length}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleExport('csv')}
                  disabled={!reportData.length}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Export CSV
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Report Preview" className="reports-list-card">
            {loading ? (
              <p>Generating report...</p>
            ) : reportData.length === 0 ? (
              <p>No data yet. Generate a report to see results.</p>
            ) : (
              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      {columnConfig.map((col) => (
                        <th key={col.key}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, index) => (
                      <tr key={row.id || row.email || index}>
                        {columnConfig.map((col) => (
                          <td key={col.key}>
                            {typeof col.format === 'function' ? col.format(row) : row[col.key] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;





