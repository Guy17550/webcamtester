import React from 'react';
import Icon from '../../../components/AppIcon';

const TechnicalInfo = ({ deviceInfo, streamInfo }) => {
  if (!deviceInfo && !streamInfo) return null;

  const infoItems = [
    {
      icon: 'Camera',
      label: 'Device',
      value: deviceInfo?.label || 'Default Camera',
      show: !!deviceInfo
    },
    {
      icon: 'Smartphone',
      label: 'Device ID',
      value: deviceInfo?.deviceId?.substring(0, 16) + '...' || 'N/A',
      show: !!deviceInfo?.deviceId
    },
    {
      icon: 'Monitor',
      label: 'Resolution',
      value: streamInfo ? `${streamInfo?.width} × ${streamInfo?.height}` : 'N/A',
      show: !!streamInfo
    },
    {
      icon: 'Zap',
      label: 'Frame Rate',
      value: streamInfo?.frameRate ? `${streamInfo?.frameRate} fps` : 'N/A',
      show: !!streamInfo?.frameRate
    },
    {
      icon: 'Ratio',
      label: 'Aspect Ratio',
      value: streamInfo ? `${streamInfo?.aspectRatio}` : 'N/A',
      show: !!streamInfo
    }
  ];

  return (
    <div className="w-full bg-card border border-border rounded-lg shadow-elevation-1 overflow-hidden">
      <div className="px-4 py-3 md:px-6 md:py-4 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="Info" size={20} color="var(--color-primary)" />
          <h3 className="text-base md:text-lg font-semibold text-foreground">
            Technical Information
          </h3>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoItems?.filter(item => item?.show)?.map((item, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg flex-shrink-0">
                <Icon 
                  name={item?.icon} 
                  size={20} 
                  color="var(--color-primary)"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="caption text-muted-foreground mb-1">
                  {item?.label}
                </p>
                <p className="monospace text-sm text-foreground font-medium text-overflow-ellipsis">
                  {item?.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechnicalInfo;