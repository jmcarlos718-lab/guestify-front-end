/**
 * Admin Policies Page
 * 
 * Manage platform policies and compliance rules
 */

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import { toast } from 'react-toastify';
import './Policies.css';

const Policies = () => {
  const [activeTab, setActiveTab] = useState('cancellation');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [policies, setPolicies] = useState({
    cancellation: {
      flexible: {
        title: 'Flexible',
        description: 'Full refund for cancellations made at least 24 hours before check-in',
        refundPercentage: 100,
        timeLimit: 24
      },
      moderate: {
        title: 'Moderate',
        description: 'Full refund for cancellations made at least 5 days before check-in',
        refundPercentage: 100,
        timeLimit: 120
      },
      strict: {
        title: 'Strict',
        description: '50% refund for cancellations made at least 14 days before check-in',
        refundPercentage: 50,
        timeLimit: 336
      }
    },
    serviceFee: {
      percentage: 10,
      minimumFee: 5,
      maximumFee: 100
    },
    rules: {
      minimumAge: 18,
      maxGuestsPerBooking: 16,
      requireVerification: true
    }
  });

  const tabs = [
    { id: 'cancellation', label: 'Cancellation Policy' },
    { id: 'serviceFee', label: 'Service Fees' },
    { id: 'rules', label: 'Rules & Regulations' },
    { id: 'compliance', label: 'Compliance' }
  ];

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      toast.success('Policies updated successfully');
      setSaving(false);
      setEditing(false);
    }, 1000);
  };

  const handlePolicyChange = (section, field, value) => {
    setPolicies(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleCancellationChange = (type, field, value) => {
    setPolicies(prev => ({
      ...prev,
      cancellation: {
        ...prev.cancellation,
        [type]: {
          ...prev.cancellation[type],
          [field]: value
        }
      }
    }));
  };

  return (
    <DashboardLayout>
      <div className="policies-page">
        <div className="policies-header">
          <div>
            <h1>Policies & Compliance</h1>
            <p>Manage platform policies, rules, and compliance settings</p>
          </div>
          <div className="header-actions">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    setEditing(false);
                    // Reload original policies
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  loading={saving}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={() => setEditing(true)}
              >
                Edit Policies
              </Button>
            )}
          </div>
        </div>

        <div className="policies-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`policy-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="policies-content">
          {/* Cancellation Policy */}
          {activeTab === 'cancellation' && (
            <Card title="Cancellation Policies" className="policy-card">
              <div className="cancellation-policies">
                {Object.entries(policies.cancellation).map(([key, policy]) => (
                  <div key={key} className="policy-item">
                    <div className="policy-header">
                      <h3>{policy.title}</h3>
                      {editing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Handle delete
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                    <div className="policy-fields">
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={policy.description}
                          onChange={(e) => handleCancellationChange(key, 'description', e.target.value)}
                          disabled={!editing}
                          className="form-textarea"
                          rows="2"
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Refund Percentage</label>
                          <Input
                            type="number"
                            value={policy.refundPercentage}
                            onChange={(e) => handleCancellationChange(key, 'refundPercentage', parseInt(e.target.value))}
                            disabled={!editing}
                            min="0"
                            max="100"
                            fullWidth
                          />
                        </div>
                        <div className="form-group">
                          <label>Time Limit (hours)</label>
                          <Input
                            type="number"
                            value={policy.timeLimit}
                            onChange={(e) => handleCancellationChange(key, 'timeLimit', parseInt(e.target.value))}
                            disabled={!editing}
                            min="0"
                            fullWidth
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Service Fees */}
          {activeTab === 'serviceFee' && (
            <Card title="Service Fee Settings" className="policy-card">
              <div className="service-fee-settings">
                <div className="form-group">
                  <label>Service Fee Percentage</label>
                  <Input
                    type="number"
                    value={policies.serviceFee.percentage}
                    onChange={(e) => handlePolicyChange('serviceFee', 'percentage', parseFloat(e.target.value))}
                    disabled={!editing}
                    min="0"
                    max="100"
                    step="0.1"
                    fullWidth
                  />
                  <small>Percentage of booking total charged as service fee</small>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Minimum Fee</label>
                    <Input
                      type="number"
                      value={policies.serviceFee.minimumFee}
                      onChange={(e) => handlePolicyChange('serviceFee', 'minimumFee', parseFloat(e.target.value))}
                      disabled={!editing}
                      min="0"
                      step="0.01"
                      fullWidth
                    />
                  </div>
                  <div className="form-group">
                    <label>Maximum Fee</label>
                    <Input
                      type="number"
                      value={policies.serviceFee.maximumFee}
                      onChange={(e) => handlePolicyChange('serviceFee', 'maximumFee', parseFloat(e.target.value))}
                      disabled={!editing}
                      min="0"
                      step="0.01"
                      fullWidth
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Rules & Regulations */}
          {activeTab === 'rules' && (
            <Card title="Platform Rules" className="policy-card">
              <div className="rules-settings">
                <div className="form-row">
                  <div className="form-group">
                    <label>Minimum Age</label>
                    <Input
                      type="number"
                      value={policies.rules.minimumAge}
                      onChange={(e) => handlePolicyChange('rules', 'minimumAge', parseInt(e.target.value))}
                      disabled={!editing}
                      min="0"
                      fullWidth
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Guests Per Booking</label>
                    <Input
                      type="number"
                      value={policies.rules.maxGuestsPerBooking}
                      onChange={(e) => handlePolicyChange('rules', 'maxGuestsPerBooking', parseInt(e.target.value))}
                      disabled={!editing}
                      min="1"
                      fullWidth
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={policies.rules.requireVerification}
                      onChange={(e) => handlePolicyChange('rules', 'requireVerification', e.target.checked)}
                      disabled={!editing}
                    />
                    <span>Require Email Verification for Registration</span>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* Compliance */}
          {activeTab === 'compliance' && (
            <Card title="Compliance Reports" className="policy-card">
              <div className="compliance-reports">
                <div className="compliance-item">
                  <div className="compliance-info">
                    <strong>Data Privacy Compliance</strong>
                    <span>GDPR, CCPA compliance status</span>
                  </div>
                  <span className="compliance-status compliant">Compliant</span>
                </div>
                <div className="compliance-item">
                  <div className="compliance-info">
                    <strong>Payment Security</strong>
                    <span>PCI DSS compliance</span>
                  </div>
                  <span className="compliance-status compliant">Compliant</span>
                </div>
                <div className="compliance-item">
                  <div className="compliance-info">
                    <strong>Terms of Service</strong>
                    <span>Last updated: Jan 15, 2024</span>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                <div className="compliance-item">
                  <div className="compliance-info">
                    <strong>Privacy Policy</strong>
                    <span>Last updated: Jan 15, 2024</span>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Policies;





