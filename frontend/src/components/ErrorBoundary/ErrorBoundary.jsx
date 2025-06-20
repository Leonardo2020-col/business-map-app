import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // ✅ LOG PARA DESARROLLO
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 ErrorBoundary Details');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  // ✅ FUNCIÓN RETRY MEJORADA
  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  // ✅ FUNCIÓN RELOAD EXISTENTE
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { 
        fallback: CustomFallback,
        showDetails = process.env.NODE_ENV === 'development',
        compact = false 
      } = this.props;

      // ✅ FALLBACK PERSONALIZADO SI SE PROPORCIONA
      if (CustomFallback) {
        return (
          <CustomFallback 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
            retryCount={this.state.retryCount}
          />
        );
      }

      // ✅ VERSIÓN COMPACTA
      if (compact) {
        return (
          <div className="error-boundary-compact">
            <span className="error-icon">⚠️</span>
            <span className="error-text">Error en componente</span>
            <button onClick={this.handleRetry} className="btn-retry-small">
              🔄
            </button>
          </div>
        );
      }

      // ✅ VERSIÓN COMPLETA MEJORADA (BASADA EN TU DISEÑO ORIGINAL)
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-header">
              <div className="error-icon">😵</div>
              <h2>Algo salió mal</h2>
              <p>Ha ocurrido un error inesperado.</p>
            </div>
            
            {/* ✅ DETALLES DEL ERROR (MEJORADO) */}
            {showDetails && this.state.error && (
              <details className="error-details">
                <summary>Ver detalles del error</summary>
                <div className="error-stack">
                  <div className="error-section">
                    <h4>Error:</h4>
                    <pre className="error-pre">{this.state.error.toString()}</pre>
                  </div>
                  
                  {this.state.errorInfo?.componentStack && (
                    <div className="error-section">
                      <h4>Component Stack:</h4>
                      <pre className="error-pre">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            {/* ✅ ACCIONES MEJORADAS */}
            <div className="error-actions">
              <button
                onClick={this.handleRetry}
                className="btn btn-primary"
              >
                🔄 Intentar de nuevo
              </button>
              
              <button
                onClick={this.handleReload}
                className="btn btn-secondary"
              >
                🔃 Recargar página
              </button>
            </div>

            {/* ✅ INFORMACIÓN ADICIONAL */}
            <div className="error-footer">
              <p>Si el problema persiste, contacta con el administrador.</p>
              {this.state.retryCount > 0 && (
                <small>Intentos realizados: {this.state.retryCount}</small>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ COMPONENTES ESPECIALIZADOS ADICIONALES

// Para usar en componentes específicos
export const ComponentErrorBoundary = ({ children, componentName = 'componente' }) => (
  <ErrorBoundary
    compact={true}
    fallback={({ onRetry }) => (
      <div className="component-error">
        <span className="error-icon-small">⚠️</span>
        <span>Error en {componentName}</span>
        <button onClick={onRetry} className="btn-retry-small">🔄</button>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

// Para páginas completas
export const PageErrorBoundary = ({ children }) => (
  <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;