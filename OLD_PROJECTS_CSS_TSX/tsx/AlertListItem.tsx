// File: C:/Users/jessa/Downloads/makers/makers/client/src/domains/common/features/Alerts/AlertListItem.tsx
import { AlertTriangle, Bell, CheckCircle, Info, XCircle } from 'lucide-react';
import type React from 'react';
import type { SystemAlert } from '@/admin/features/pwa-health/pages/alerts/types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface AlertListItemProps {
  alert: SystemAlert;
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onDelete?: (id: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export const AlertListItem: React.FC<AlertListItemProps> = ({
  alert,
  onAcknowledge,
  onResolve,
  onDelete,
  isUpdating,
  isDeleting,
}) => {
  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      case 'success':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getBorderClasses = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityColors = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-black',
      low: 'bg-blue-500 text-white',
    };
    return severityColors[severity as keyof typeof severityColors] || 'bg-gray-500 text-white';
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border-l-4 ${getBorderClasses(alert.type)}`}
    >
      <div className="flex items-start gap-3 flex-grow mb-3 sm:mb-0">
        {getAlertIcon(alert.type)}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-800">{alert.title}</h4>
            <Badge variant={getAlertVariant(alert.type)} className="capitalize">
              {alert.type}
            </Badge>
            <Badge className={`capitalize ${getSeverityBadge(alert.severity)}`}>
              {alert.severity}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>Created: {new Date(alert.created_at).toLocaleString()}</span>
            {alert.source_service && <span>Service: {alert.source_service}</span>}
            {alert.source_component && <span>Component: {alert.source_component}</span>}
            <Badge
              variant={
                alert.status === 'active'
                  ? 'destructive'
                  : alert.status === 'acknowledged'
                    ? 'secondary'
                    : 'default'
              }
              className="capitalize"
            >
              {alert.status}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto justify-end">
        {alert.status === 'active' && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => onAcknowledge(alert.id)}
              disabled={isUpdating}
            >
              {isUpdating ? 'Processing...' : 'Acknowledge'}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              onClick={() => onResolve(alert.id)}
              disabled={isUpdating}
            >
              {isUpdating ? 'Processing...' : 'Resolve'}
            </Button>
          </>
        )}
        {alert.status === 'acknowledged' && (
          <Button
            variant="default"
            size="sm"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            onClick={() => onResolve(alert.id)}
            disabled={isUpdating}
          >
            {isUpdating ? 'Processing...' : 'Resolve'}
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(alert.id)}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        )}
      </div>
    </div>
  );
};
