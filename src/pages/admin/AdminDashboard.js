import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loading from '../../components/common/Loading';
import {
  fetchStats,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchHosts,
  createHost,
  updateHost,
  deleteHost,
  fetchListings,
  createListing,
  updateListing,
  deleteListing
} from '../../services/adminService';
import * as firestoreService from '../../services/firestoreService';
import { formatCurrency } from '../../utils/helpers';
import { toast } from 'react-toastify';
import { useAuthContext } from '../../context/AuthContext';
import { auth } from '../../config/firebase';

const RESOURCE_CONFIG = {
  users: {
    title: 'Users',
    description: 'Guests and multi-role members',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role', format: (row) => row.role?.toUpperCase() },
      { key: 'status', label: 'Status', format: (row) => row.status?.toUpperCase() },
      { key: 'isVerified', label: 'Verified', format: (row) => (row.isVerified ? 'Yes' : 'No') },
      { key: 'createdAt', label: 'Joined', format: (row) => new Date(row.createdAt).toLocaleDateString() }
    ],
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        options: [
          { label: 'Guest', value: 'guest' },
          { label: 'Host', value: 'host' },
          { label: 'Admin', value: 'admin' }
        ],
        required: true
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' }
        ],
        required: true
      },
      {
        name: 'isVerified',
        label: 'Email Verified',
        type: 'select',
        options: [
          { label: 'Yes', value: true },
          { label: 'No', value: false }
        ]
      }
    ],
    service: {
      fetch: fetchUsers,
      create: createUser,
      update: updateUser,
      remove: deleteUser
    },
    transform: (values) => ({
      ...values,
      isVerified: values.isVerified === true || values.isVerified === 'true'
    })
  },
  hosts: {
    title: 'Hosts',
    description: 'Manage verified hosts and partners',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status', format: (row) => row.status?.toUpperCase() },
      { key: 'createdAt', label: 'Joined', format: (row) => new Date(row.createdAt).toLocaleDateString() }
    ],
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email Address', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' }
        ],
        required: true
      }
    ],
    service: {
      fetch: fetchHosts,
      create: createHost,
      update: updateHost,
      remove: deleteHost
    },
    transform: (values) => values
  },
  listings: {
    title: 'Listings',
    description: 'Property and experience inventory',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'hostName', label: 'Host' },
      {
        key: 'price',
        label: 'Price',
        format: (row) => formatCurrency(row.price || 0)
      },
      { key: 'location', label: 'Location' },
      { key: 'status', label: 'Status', format: (row) => row.status?.toUpperCase() }
    ],
    fields: [
      { name: 'hostId', label: 'Host ID', type: 'number', required: true },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'price', label: 'Price (PHP)', type: 'number', step: '0.01', required: true },
      { name: 'location', label: 'Location', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
          { label: 'Archived', value: 'archived' }
        ],
        required: true
      }
    ],
    service: {
      fetch: fetchListings,
      create: createListing,
      update: updateListing,
      remove: deleteListing
    },
    transform: (values) => ({
      ...values,
      hostId: Number(values.hostId),
      price: Number(values.price)
    })
  }
};

const tabs = [
  { key: 'users', label: 'Users' },
  { key: 'hosts', label: 'Hosts' },
  { key: 'listings', label: 'Listings' }
];

const AdminDashboard = () => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState({
    users: 0,
    verifiedUsers: 0,
    hosts: 0,
    listings: 0,
    totalEarnings: 0
  });
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tableData, setTableData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0
  });
  const [tableLoading, setTableLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [reloadSignal, setReloadSignal] = useState(0);
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'create',
    record: null
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load stats from backend API
        const data = await fetchStats();
        
        // Load earnings from Firestore payments
        let totalEarnings = 0;
        try {
          // Wait for Firebase Auth to be ready (admin sign-in might be in progress)
          let currentUser = auth.currentUser;
          if (!currentUser) {
            // Wait up to 3 seconds for Firebase Auth to initialize
            console.log('[AdminDashboard] Waiting for Firebase Auth...');
            for (let i = 0; i < 30 && !currentUser; i++) {
              await new Promise(resolve => setTimeout(resolve, 100));
              currentUser = auth.currentUser;
            }
          }
          
          if (!currentUser) {
            console.warn('[AdminDashboard] User is not authenticated with Firebase Auth. Cannot load payments.');
            toast.warn('Please sign in again to authenticate with Firebase Auth and view payment data.');
          } else {
            console.log('[AdminDashboard] Firebase Auth user:', currentUser.uid, currentUser.email);
            
            // Get all payments - admin gets 15% of each payment (stored in adminIncome field)
            // Note: Admin can read all payments per Firestore rules (if authenticated with Firebase Auth)
            const payments = await firestoreService.getDocuments(
              'payments',
              [], // No filter - get all payments (admin has permission to read all)
              null, // No orderBy to avoid index requirement
              'asc'
            );
          
            
            console.log('[AdminDashboard] Loaded payments:', payments.length);
            
            // Calculate total admin earnings
          // adminIncome is already set to 15% of total payment amount when payment is created
          // If refunds were processed, adminIncome is already reduced in the payment document
          totalEarnings = payments.reduce((sum, payment) => {
            const amount = typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount) || 0;
            
            // Use adminIncome field if available (which is 15% of payment amount, minus any refund deductions)
            // If adminIncome is not set, calculate it as 15% of amount (fallback for old payments)
            let adminIncome = payment.adminIncome;
            if (adminIncome === null || adminIncome === undefined) {
              // Fallback: calculate 15% if adminIncome is not set
              adminIncome = amount * 0.15;
            }
            
            // Ensure we're working with a number
            const incomeValue = typeof adminIncome === 'number' ? adminIncome : parseFloat(adminIncome) || 0;
            
            // Log for debugging
            if (process.env.NODE_ENV === 'development') {
              console.log('[AdminDashboard] Payment:', {
                id: payment.id,
                amount,
                adminIncome: incomeValue,
                hostIncome: payment.hostIncome,
                calculated: payment.adminIncome === null || payment.adminIncome === undefined
              });
            }
            
            return sum + incomeValue;
          }, 0);
          
            console.log('[AdminDashboard] Total admin earnings calculated:', totalEarnings);
          }
        } catch (paymentError) {
          console.error('[AdminDashboard] Error loading payments:', paymentError);
          console.error('[AdminDashboard] Error details:', {
            code: paymentError.code,
            message: paymentError.message
          });
          // Don't fail the whole stats load if payments fail
          toast.error('Unable to load payment data. Please check console for details.');
        }
        
        setStats({
          users: data.users || 0,
          verifiedUsers: data.verifiedUsers || 0,
          hosts: data.hosts || 0,
          listings: data.listings || 0,
          totalEarnings
        });
      } catch (error) {
        toast.error(error.message || 'Unable to load dashboard stats');
      } finally {
        setGlobalLoading(false);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    const loadResource = async () => {
      const config = RESOURCE_CONFIG[activeTab];
      if (!config) return;
      setTableLoading(true);
      try {
        const response = await config.service.fetch({
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch || undefined
        });
        setTableData(response.data || []);
        setPagination((prev) => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 1
        }));
      } catch (error) {
        toast.error(error.message || `Unable to load ${config.title.toLowerCase()}`);
      } finally {
        setTableLoading(false);
      }
    };
    loadResource();
  }, [activeTab, pagination.page, pagination.limit, debouncedSearch, reloadSignal]);

  const config = RESOURCE_CONFIG[activeTab];

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setPagination((prev) => ({ ...prev, page: 1, totalPages: 1, total: 0 }));
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const openModal = (mode, record = null) => {
    setModalState({
      open: true,
      mode,
      record
    });
  };

  const closeModal = () => {
    setModalState({
      open: false,
      mode: 'create',
      record: null
    });
  };

  const handleDelete = async (record) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }
    try {
      await config.service.remove(record.id);
      toast.success('Record deleted successfully');
      setTableData((prev) => prev.filter((item) => item.id !== record.id));
      setStats((prev) => {
        if (activeTab === 'users') {
          return { ...prev, users: Math.max(0, prev.users - 1) };
        }
        if (activeTab === 'hosts') {
          return { ...prev, hosts: Math.max(0, prev.hosts - 1) };
        }
        if (activeTab === 'listings') {
          return { ...prev, listings: Math.max(0, prev.listings - 1) };
        }
        return prev;
      });
      setReloadSignal((prev) => prev + 1);
    } catch (error) {
      toast.error(error.message || 'Unable to delete record');
    }
  };

  const handleModalSubmit = async (values) => {
    const payload = config.transform(values);
    try {
      if (modalState.mode === 'edit' && modalState.record) {
        await config.service.update(modalState.record.id, payload);
        toast.success(`${config.title.slice(0, -1)} updated successfully`);
      } else {
        await config.service.create(payload);
        toast.success(`${config.title.slice(0, -1)} created successfully`);
      }
      closeModal();
      setReloadSignal((prev) => prev + 1);
    } catch (error) {
      toast.error(error.message || 'Unable to save record');
    }
  };

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
      <StatCard label="Total Users" value={stats.users} accent="text-blue-600" />
      <StatCard label="Verified Users" value={stats.verifiedUsers} accent="text-emerald-600" />
      <StatCard label="Hosts" value={stats.hosts} accent="text-amber-600" />
      <StatCard label="Listings" value={stats.listings} accent="text-indigo-600" />
      <StatCard 
        label="Admin Income (15% of payments)" 
        value={formatCurrency(stats.totalEarnings, 'PHP')} 
        accent="text-green-600" 
        isCurrency={true}
      />
    </div>
  );

  if (globalLoading) {
    return (
      <DashboardLayout>
        <Loading fullScreen message="Loading admin dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold text-brand-600">Admin Control Center</p>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">Dashboard Overview</h1>
              <p className="text-slate-500">Manage users, hosts, and listings in one responsive workspace.</p>
            </div>
            <div className="text-sm text-slate-500">
              Last refreshed:{' '}
              <span className="font-medium text-slate-700">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </header>

        <StatsCards />

        <div className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    activeTab === tab.key
                      ? 'bg-brand-600 text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${config.title.toLowerCase()}...`}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
              </div>
              <button
                onClick={() => openModal('create')}
                className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                + Add {config.title.slice(0, -1)}
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-500">{config.description}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  {config.columns.map((column) => (
                    <th key={column.key} className="text-left px-6 py-4 font-semibold tracking-wide">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right font-semibold tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan={config.columns.length + 1} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <span className="w-6 h-6 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
                        Loading {config.title.toLowerCase()}...
                      </div>
                    </td>
                  </tr>
                ) : tableData.length === 0 ? (
                  <tr>
                    <td colSpan={config.columns.length + 1} className="px-6 py-12 text-center text-slate-500">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  tableData.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition">
                      {config.columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 text-slate-700">
                          {column.format ? column.format(row) : row[column.key] || '—'}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openModal('edit', row)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:border-brand-400 hover:text-brand-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-4 border-t border-slate-100 text-sm text-slate-500">
            <div>
              Showing page {pagination.page} of {pagination.totalPages}, {pagination.total} records total.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand-400 hover:text-brand-600 transition"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.totalPages, prev.page + 1)
                  }))
                }
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand-400 hover:text-brand-600 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {modalState.open && (
          <ResourceModal
            config={config}
            mode={modalState.mode}
            record={modalState.record}
            onClose={closeModal}
            onSubmit={handleModalSubmit}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({ label, value, accent, isCurrency = false }) => (
  <div className="bg-white rounded-2xl shadow-card p-6 flex flex-col gap-2">
    <p className="text-sm text-slate-500">{label}</p>
    <p className={`text-3xl font-semibold ${accent}`}>
      {isCurrency ? value : typeof value === 'number' ? value.toLocaleString() : value}
    </p>
  </div>
);

const ResourceModal = ({ config, mode, record, onClose, onSubmit }) => {
  const initialValues = useMemo(() => {
    const base = {};
    config.fields.forEach((field) => {
      const recordValue = record?.[field.name];
      if (field.type === 'select') {
        const defaultValue = field.options?.[0]?.value ?? '';
        base[field.name] =
          recordValue === undefined || recordValue === null ? String(defaultValue) : String(recordValue);
      } else {
        base[field.name] = recordValue !== undefined && recordValue !== null ? String(recordValue) : '';
      }
    });
    return base;
  }, [config.fields, record]);

  const [formValues, setFormValues] = useState(initialValues);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  const handleChange = (name, value, type) => {
    let nextValue = value;
    if (type === 'number') {
      nextValue = value;
    }
    setFormValues((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center px-4 py-8 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600 uppercase tracking-wide">
              {mode === 'edit' ? 'Edit' : 'Create'} {config.title.slice(0, -1)}
            </p>
            <h2 className="text-2xl font-semibold text-slate-900 mt-1">
              {mode === 'edit' ? `Update ${config.title.slice(0, -1)}` : `Add ${config.title.slice(0, -1)}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition text-xl font-semibold"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {config.fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-600">
                {field.label} {field.required && <span className="text-rose-500">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  value={formValues[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {field.options?.map((option) => (
                    <option key={option.value?.toString()} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formValues[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                  rows={4}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <input
                  type={field.type}
                  value={formValues[field.name] ?? ''}
                  step={field.step}
                  onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition"
            >
              {mode === 'edit' ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard;

