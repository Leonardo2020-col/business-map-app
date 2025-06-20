import React from 'react';
import './LoadingSpinner.css';

// ✅ COMPONENTE OPTIMIZADO Y VERSÁTIL
const LoadingSpinner = React.memo(({ 
  size = 'medium',
  message = 'Cargando...',
  type = 'spinner',
  fullScreen = false,
  color = 'primary',
  inline = false,
  overlay = false
}) => {
  const sizeClasses = {
    small: 'loading-small',
    medium: 'loading-medium', 
    large: 'loading-large'
  };

  const typeClasses = {
    spinner: 'loading-spinner',
    dots: 'loading-dots',
    pulse: 'loading-pulse',
    bars: 'loading-bars'
  };

  const colorClasses = {
    primary: 'loading-primary',
    secondary: 'loading-secondary',
    success: 'loading-success',
    warning: 'loading-warning',
    danger: 'loading-danger'
  };

  const containerClasses = [
    'loading-container',
    sizeClasses[size],
    colorClasses[color],
    fullScreen && 'loading-fullscreen',
    inline && 'loading-inline',
    overlay && 'loading-overlay'
  ].filter(Boolean).join(' ');

  const renderSpinner = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="loading-dots-container">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        );
      
      case 'pulse':
        return <div className="loading-pulse-circle"></div>;
      
      case 'bars':
        return (
          <div className="loading-bars-container">
            <div className="loading-bar"></div>
            <div className="loading-bar"></div>
            <div className="loading-bar"></div>
            <div className="loading-bar"></div>
          </div>
        );
      
      default: // spinner
        return <div className="loading-spinner-circle"></div>;
    }
  };

  return (
    <div className={containerClasses}>
      <div className={`loading-content ${typeClasses[type]}`}>
        {renderSpinner()}
        {message && (
          <p className="loading-message">{message}</p>
        )}
      </div>
    </div>
  );
});

// ✅ VARIANTES ESPECÍFICAS MEMOIZADAS
export const LoadingPage = React.memo(({ message = 'Cargando página...' }) => (
  <LoadingSpinner 
    size="large" 
    message={message} 
    fullScreen={true}
    type="spinner"
  />
));

export const LoadingInline = React.memo(({ message = 'Cargando...', size = 'small' }) => (
  <LoadingSpinner 
    size={size} 
    message={message} 
    inline={true}
    type="dots"
  />
));

export const LoadingOverlay = React.memo(({ message = 'Procesando...' }) => (
  <LoadingSpinner 
    size="medium" 
    message={message} 
    overlay={true}
    type="pulse"
  />
));

export const LoadingButton = React.memo(() => (
  <LoadingSpinner 
    size="small" 
    message="" 
    inline={true}
    type="spinner"
    color="secondary"
  />
));

export default LoadingSpinner;