import React from 'react';
import Icon from './AppIcon';

const StatusIndicator = ({ 
  status = 'idle',
  message = '',
  deviceName = ''
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'requesting':
        return {
          icon: 'Loader2',
          iconColor: 'var(--color-warning)',
          bgColor: 'bg-warning/10',
          textColor: 'text-warning',
          borderColor: 'border-warning/20',
          label: 'Requesting Permission',
          animate: true
        };
      case 'granted':
        return {
          icon: 'CheckCircle2',
          iconColor: 'var(--color-success)',
          bgColor: 'bg-success/10',
          textColor: 'text-success',
          borderColor: 'border-success/20',
          label: 'Camera Active',
          animate: false
        };
      case 'denied':
        return {
          icon: 'XCircle',
          iconColor: 'var(--color-error)',
          bgColor: 'bg-error/10',
          textColor: 'text-error',
          borderColor: 'border-error/20',
          label: 'Permission Denied',
          animate: false
        };
      case 'error':
        return {
          icon: 'AlertCircle',
          iconColor: 'var(--color-error)',
          bgColor: 'bg-error/10',
          textColor: 'text-error',
          borderColor: 'border-error/20',
          label: 'Camera Error',
          animate: false
        };
      case 'connecting':
        return {
          icon: 'Loader2',
          iconColor: 'var(--color-primary)',
          bgColor: 'bg-primary/10',
          textColor: 'text-primary',
          borderColor: 'border-primary/20',
          label: 'Connecting to Camera',
          animate: true
        };
      default:
        return {
          icon: 'Camera',
          iconColor: 'var(--color-muted-foreground)',
          bgColor: 'bg-muted',
          textColor: 'text-muted-foreground',
          borderColor: 'border-border',
          label: 'Camera Inactive',
          animate: false
        };
    }
  };

  const config = getStatusConfig();

  if (status === 'idle') {
    return null;
  }

  return (
    <div 
      className={`
        inline-flex items-center gap-3 px-4 py-3 rounded-lg border
        ${config?.bgColor} ${config?.borderColor}
        transition-smooth shadow-elevation-1
      `}
      role="status"
      aria-live="polite"
    >
      <div className={config?.animate ? 'animate-spin' : ''}>
        <Icon 
          name={config?.icon} 
          size={20} 
          color={config?.iconColor}
          strokeWidth={2}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className={`text-sm font-medium ${config?.textColor}`}>
          {config?.label}
        </span>
        
        {message && (
          <span className="caption text-muted-foreground line-clamp-2">
            {message}
          </span>
        )}
        
        {deviceName && status === 'granted' && (
          <span className="monospace text-xs text-muted-foreground text-overflow-ellipsis">
            {deviceName}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatusIndicator;