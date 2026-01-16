import React from 'react';
import Icon from '../../../components/AppIcon';

const BrowserCompatibility = () => {
  const compatibilityInfo = [
    {
      icon: 'Chrome',
      browser: 'Chrome',
      status: 'Full Support',
      version: '53+',
      color: 'var(--color-success)'
    },
    {
      icon: 'Globe',
      browser: 'Firefox',
      status: 'Full Support',
      version: '36+',
      color: 'var(--color-success)'
    },
    {
      icon: 'Globe',
      browser: 'Safari',
      status: 'Full Support',
      version: '11+',
      color: 'var(--color-success)'
    },
    {
      icon: 'Globe',
      browser: 'Edge',
      status: 'Full Support',
      version: '12+',
      color: 'var(--color-success)'
    }
  ];

  const requirements = [
    'HTTPS connection or localhost required',
    'Camera permissions must be granted',
    'Camera device must be connected',
    'No other application using the camera'
  ];

  return (
    <div className="w-full bg-card border border-border rounded-lg shadow-elevation-1 overflow-hidden">
      <div className="px-4 py-3 md:px-6 md:py-4 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="Globe" size={20} color="var(--color-primary)" />
          <h3 className="text-base md:text-lg font-semibold text-foreground">
            Browser Compatibility
          </h3>
        </div>
      </div>
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {compatibilityInfo?.map((item, index) => (
            <div 
              key={index}
              className="flex flex-col items-center gap-2 p-3 bg-muted/30 rounded-lg"
            >
              <Icon 
                name={item?.icon} 
                size={24} 
                color={item?.color}
              />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {item?.browser}
                </p>
                <p className="caption text-muted-foreground">
                  {item?.version}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Requirements:
          </h4>
          <div className="space-y-2">
            {requirements?.map((req, index) => (
              <div key={index} className="flex items-start gap-2">
                <Icon 
                  name="CheckCircle2" 
                  size={16} 
                  color="var(--color-success)"
                  className="mt-0.5 flex-shrink-0"
                />
                <p className="text-sm text-muted-foreground">
                  {req}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowserCompatibility;