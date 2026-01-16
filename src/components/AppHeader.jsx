import React from 'react';
import Icon from './AppIcon';

const AppHeader = () => {
  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg transition-smooth">
              <Icon name="Video" size={24} color="var(--color-primary)" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-foreground leading-tight">
                WebcamTester
              </h1>
              <span className="caption text-muted-foreground">
                Developer Camera Testing Utility
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;