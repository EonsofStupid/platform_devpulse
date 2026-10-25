// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/admin/features/PWAHealth/pages/alerts/Alerts.pg.tsx
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bell } from 'lucide-react';
import React from 'react';
// Alert components placeholders - implement as needed
const AlertConfigurationComponent = () => <div>Alert Configuration</div>;
const AlertListItem = () => <div>Alert List Item</div>;
const AlertSummaryCard = () => <div>Alert Summary Card</div>;
// Telemetry service
import { telemetryService } from '@/common/features/Telemetry/Telemetry.svc';
// Import from local hooks
import { useAlertConfig, useAlertSummary, useSystemAlerts } from './hooks';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// Design System styles loaded via single entry point
import '@/domains/admin/features/pulseos/styles/index.ds.css';

export const Alerts: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [filterSeverity, setFilterSeverity] = React.useState<string>('all');

  // Use custom hooks
  const {
    data: alerts,
    isLoading,
    isError,
    error,
    updateAlertStatus,
    createAlert,
    deleteAlert,
    isUpdating,
    isCreating,
    isDeleting,
  } = useSystemAlerts();
  const { summary } = useAlertSummary();
  const { config } = useAlertConfig();

  const handleAcknowledge = async (id: string) => {
    try {
      await updateAlertStatus(id, 'acknowledged');
      telemetryService.captureEvent({
        type: 'custom',
        message: 'alert.acknowledged',
        data: { alertId: id },
      });
    } catch (err) {
      telemetryService.captureError(err as any, {
        context: 'acknowledge_alert_action',
        alertId: id,
      });
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await updateAlertStatus(id, 'resolved');
      telemetryService.captureEvent({
        type: 'custom',
        message: 'alert.resolved',
        data: { alertId: id },
      });
    } catch (err) {
      telemetryService.captureError(err as any, {
        context: 'resolve_alert_action',
        alertId: id,
      });
      console.error('Failed to resolve alert:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        await deleteAlert(id);
        telemetryService.captureEvent({
          type: 'custom',
          message: 'alert.deleted',
          data: { alertId: id },
        });
      } catch (err) {
        telemetryService.captureError(err as any, {
          context: 'delete_alert_action',
          alertId: id,
        });
        console.error('Failed to delete alert:', err);
      }
    }
  };

  const handleCreateTestAlert = async () => {
    try {
      await createAlert({
        type: 'warning',
        title: 'Test Alert',
        message: 'This is a test alert created from the admin panel',
        status: 'active',
        severity: 'medium',
        source_service: 'admin_panel',
        source_component: 'alerts_page',
        metadata: {
          created_by: 'manual_test',
          timestamp: new Date().toISOString(),
        },
      });
      telemetryService.captureEvent({ type: 'custom', message: 'alert.test_created' });
    } catch (err) {
      telemetryService.captureError(err as any, { context: 'create_test_alert' });
      console.error('Failed to create test alert:', err);
    }
  };

  // Filter alerts based on status and severity
  const filteredAlerts = React.useMemo(() => {
    if (!alerts) return [];

    return alerts.filter((alert) => {
      const statusMatch = filterStatus === 'all' || alert.status === filterStatus;
      const severityMatch = filterSeverity === 'all' || alert.severity === filterSeverity;
      return statusMatch && severityMatch;
    });
  }, [alerts, filterStatus, filterSeverity]);

  // Loading state
  if (isLoading) {
    return (
      <div className="alerts-loading">
        <div className="alerts-loading-spinner"></div>
        <p className="alerts-loading-text">Loading alerts...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="alerts-error">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h1 className="alerts-error-title">Error Loading Alerts</h1>
        <p className="alerts-error-message">
          {error?.message || 'Something went wrong while fetching alerts.'}
        </p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['systemAlerts'] })}
          className="alerts-error-retry"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 alerts-container">
      {/* Header */}
      <div className="alerts-header">
        <div>
          <h1 className="alerts-title">Alert Center</h1>
          <p className="alerts-subtitle">System alerts and notification management</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="alerts-badge">
            <Bell className="h-5 w-5" />
            {summary?.active || 0} Active Alerts
          </Badge>
          <Button
            onClick={handleCreateTestAlert}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? 'Creating...' : 'Create Test Alert'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Severity:</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              Showing {filteredAlerts.length} of {alerts?.length || 0} alerts
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Summary */}
      <div className="alerts-summary-grid">
        <AlertSummaryCard
          type="error"
          title="Critical"
          count={summary?.critical || 0}
          description="High priority alerts"
        />
        <AlertSummaryCard
          type="warning"
          title="Warnings"
          count={summary?.warning || 0}
          description="Medium priority alerts"
        />
        <AlertSummaryCard
          type="info"
          title="Info"
          count={summary?.info || 0}
          description="Informational alerts"
        />
        <AlertSummaryCard
          type="success"
          title="Resolved"
          count={summary?.resolved || 0}
          description="Recently resolved"
        />
      </div>

      {/* Recent Alerts List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAlerts && filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <AlertListItem
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                  onResolve={handleResolve}
                  onDelete={handleDelete}
                  isUpdating={isUpdating}
                  isDeleting={isDeleting}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {filterStatus === 'all' && filterSeverity === 'all'
                    ? 'No alerts to display'
                    : 'No alerts match your filters'}
                </p>
                <p className="text-gray-400 text-sm">
                  {filterStatus === 'all' && filterSeverity === 'all'
                    ? 'Your system is running smoothly'
                    : 'Try adjusting your filter criteria'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert Configuration */}
      <AlertConfigurationComponent config={config} />

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Alert Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="alert-actions-container">
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['systemAlerts'] })}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Refresh Alerts
            </Button>
            <Button
              onClick={handleCreateTestAlert}
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? 'Creating...' : 'Create Test Alert'}
            </Button>
            <Button variant="outline">Configure Rules</Button>
            <Button variant="outline">View History</Button>
            <Button variant="outline">Export Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
