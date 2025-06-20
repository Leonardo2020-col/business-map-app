import React from 'react';
import { SERVICES, SERVICE_STATUS } from '../../constants/serviceConstants';
import { getDateStatus, getStatusIcon, getStatusText, formatDate } from '../../utils/dateUtils';
import './ServicesStatus.css';

const ServicesStatus = ({ business, compact = false, showTitle = false }) => {
  const getServiceStatus = (dateString) => getDateStatus(dateString);

  if (compact) {
    // Vista compacta - solo mostrar servicios con problemas
    const problematicServices = SERVICES.filter(service => {
      const status = getServiceStatus(business[service.key]);
      return status === SERVICE_STATUS.EXPIRED || status === SERVICE_STATUS.EXPIRING_SOON;
    });

    if (problematicServices.length === 0) {
      return <span className="services-status-ok">✅ Todo al día</span>;
    }

    return (
      <div className="services-status-compact">
        {problematicServices.map(service => {
          const status = getServiceStatus(business[service.key]);
          return (
            <span 
              key={service.key} 
              className={`service-badge ${status}`}
              title={`${service.name}: ${formatDate(business[service.key])} - ${getStatusText(status)}`}
            >
              {service.icon} {getStatusIcon(status)}
            </span>
          );
        })}
      </div>
    );
  }

  // Vista completa
  return (
    <div className="services-status">
      {showTitle && (
        <h4 className="services-title">📋 Estado de Servicios</h4>
      )}
      
      <div className="services-grid">
        {SERVICES.map(service => {
          const status = getServiceStatus(business[service.key]);
          const dateValue = business[service.key];
          
          return (
            <div key={service.key} className={`service-item ${status}`}>
              <div className="service-header">
                <span className="service-icon">{service.icon}</span>
                <span className="service-name">{service.name}</span>
              </div>
              
              <div className="service-info">
                {dateValue ? (
                  <>
                    <span className="service-date">
                      📅 {formatDate(dateValue)}
                    </span>
                    <span className={`service-status ${status}`}>
                      {getStatusIcon(status)} {getStatusText(status)}
                    </span>
                  </>
                ) : (
                  <span className="service-no-date">
                    ⚪ Sin fecha registrada
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServicesStatus;