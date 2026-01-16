import React from 'react';
import Icon from '../../../components/AppIcon';

const ErrorDisplay = ({ error, onRetry }) => {
  const errorMessages = {
    NotAllowedError: {
      title: 'Camera Access Denied',
      description: 'You denied camera permissions. Please allow camera access in your browser settings to continue.',
      icon: 'ShieldOff',
      color: 'var(--color-destructive)',
      solutions: [
        'Click the camera icon in your browser\'s address bar',
        'Select "Allow" for camera permissions',
        'Refresh the page and try again'
      ]
    },
    NotFoundError: {
      title: 'No Camera Detected',
      description: 'No camera device was found on your system. Please connect a webcam and try again.',
      icon: 'CameraOff',
      color: 'var(--color-muted-foreground)',
      solutions: [
        'Ensure your webcam is properly connected',
        'Check if camera drivers are installed',
        'Try a different USB port if using external webcam'
      ]
    },
    NotReadableError: {
      title: 'Camera In Use or Unavailable',
      description: 'The camera is already being used by another application or could not be started. Please close other apps using the camera.',
      icon: 'AlertCircle',
      color: 'var(--color-warning)',
      solutions: [
        'Close other browser tabs or apps using the camera',
        'Check if video conferencing apps (Zoom, Teams, etc.) are running',
        'Restart your browser and try again',
        'On Windows: Check Camera privacy settings',
        'On Mac: Check System Preferences > Security & Privacy > Camera'
      ]
    },
    OverconstrainedError: {
      title: 'Camera Constraints Not Supported',
      description: 'Your camera doesn\'t support the requested video settings.',
      icon: 'Settings',
      color: 'var(--color-warning)',
      solutions: [
        'Your camera may not support the requested resolution',
        'Try using a different camera if available',
        'The app will attempt to use default settings'
      ]
    },
    AbortError: {
      title: 'Camera Access Aborted',
      description: 'Camera access was interrupted. This may be due to hardware or system issues.',
      icon: 'XCircle',
      color: 'var(--color-destructive)',
      solutions: [
        'Check if your camera is properly connected',
        'Restart your browser',
        'Check system camera settings'
      ]
    }
  };

  const getErrorDetails = (errorType) => {
    switch (errorType) {
      case 'NotAllowedError':
        return {
          title: 'Camera Permission Denied',
          message: 'You have denied camera access. Please allow camera permissions in your browser settings and try again.',
          icon: 'ShieldAlert',
          color: 'var(--color-error)'
        };
      case 'NotFoundError':
        return {
          title: 'No Camera Detected',
          message: 'No camera device was found on your system. Please connect a webcam and refresh the page.',
          icon: 'CameraOff',
          color: 'var(--color-error)'
        };
      case 'NotReadableError':
        return {
          title: 'Camera Already in Use',
          message: 'The camera is being used by another application. Please close other apps using the camera and try again.',
          icon: 'AlertTriangle',
          color: 'var(--color-warning)'
        };
      case 'OverconstrainedError':
        return {
          title: 'Camera Constraints Not Supported',
          message: 'The requested camera settings are not supported by your device. Try using default settings.',
          icon: 'Settings',
          color: 'var(--color-warning)'
        };
      case 'SecurityError':
        return {
          title: 'Security Error',
          message: 'Camera access is blocked due to security restrictions. Ensure you are using HTTPS or localhost.',
          icon: 'Lock',
          color: 'var(--color-error)'
        };
      default:
        return {
          title: 'Camera Access Failed',
          message: error || 'An unknown error occurred while accessing the camera. Please try again.',
          icon: 'AlertCircle',
          color: 'var(--color-error)'
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="w-full p-6 md:p-8 bg-error/5 border border-error/20 rounded-lg">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-error/10 rounded-full">
          <Icon 
            name={errorDetails?.icon} 
            size={32} 
            color={errorDetails?.color}
            strokeWidth={1.5}
          />
        </div>
        
        <div className="space-y-2 max-w-md">
          <h3 className="text-lg md:text-xl font-semibold text-error">
            {errorDetails?.title}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {errorDetails?.message}
          </p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth text-sm font-medium focus-ring"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;