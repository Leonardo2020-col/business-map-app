// 🏘️ src/components/Map/DistrictInfoPanel.jsx
// Panel de información detallada del Distrito de San Antonio

import React, { useState, useEffect } from 'react';
import { generateDistrictReport, SAN_ANTONIO_DISTRICT } from '../../utils/geospatialUtils';

const DistrictInfoPanel = ({ 
  businesses = [], 
  isVisible = false, 
  onClose,
  selectedAnexo = null 
}) => {
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (businesses.length > 0) {
      const districtReport = generateDistrictReport(businesses);
      setReport(districtReport);
    }
  }, [businesses]);

  if (!isVisible || !report) return null;

  const anexoInfo = selectedAnexo ? SAN_ANTONIO_DISTRICT.anexos[selectedAnexo] : null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90vw',
      maxWidth: '800px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      zIndex: 10000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px' }}>
            🏘️ {anexoInfo ? anexoInfo.name : 'Distrito de San Antonio'}
          </h2>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
            {anexoInfo ? anexoInfo.description : 'Información general del distrito'}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa'
      }}>
        {[
          { id: 'overview', label: '📊 Resumen', icon: '📊' },
          { id: 'anexos', label: '🗺️ Por Anexo', icon: '🗺️' },
          { id: 'types', label: '🏢 Tipos', icon: '🏢' },
          { id: 'recommendations', label: '💡 Recomendaciones', icon: '💡' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '15px 10px',
              border: 'none',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#667eea' : '#666',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '3px solid #667eea' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px'
      }}>
        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <StatCard
                icon="🏢"
                title="Total Negocios"
                value={report.summary.totalBusinesses}
                subtitle="en toda la base de datos"
              />
              <StatCard
                icon="🏘️"
                title="En San Antonio"
                value={report.summary.businessesInDistrict}
                subtitle={`${report.summary.coverage}% de cobertura`}
                color="#667eea"
              />
              <StatCard
                icon="📍"
                title="Con Ubicación"
                value={report.coverage.withCoordinates}
                subtitle={`${report.coverage.withoutCoordinates} sin coordenadas`}
                color="#28a745"
              />
              <StatCard
                icon="🗺️"
                title="Anexos"
                value={report.summary.anexos}
                subtitle="zonas del distrito"
                color="#17a2b8"
              />
            </div>

            <div style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>
                🎯 Datos Clave del Distrito
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6c757d' }}>
                <li>Municipalidad: {SAN_ANTONIO_DISTRICT.municipality}</li>
                <li>Provincia: {SAN_ANTONIO_DISTRICT.province}</li>
                <li>Región: {SAN_ANTONIO_DISTRICT.region}</li>
                <li>Coordenadas del centro: {SAN_ANTONIO_DISTRICT.center.lat.toFixed(4)}, {SAN_ANTONIO_DISTRICT.center.lng.toFixed(4)}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab: Por Anexo */}
        {activeTab === 'anexos' && (
          <div>
            {Object.entries(report.byAnexo).map(([anexoKey, anexoData]) => {
              const anexoInfo = SAN_ANTONIO_DISTRICT.anexos[anexoKey];
              return (
                <div key={anexoKey} style={{
                  background: '#f8f9fa',
                  border: `2px solid ${anexoInfo.color}`,
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <h4 style={{ 
                        margin: 0, 
                        color: anexoInfo.color,
                        fontSize: '18px'
                      }}>
                        ● {anexoInfo.name}
                      </h4>
                      <p style={{ 
                        margin: '5px 0', 
                        color: '#6c757d',
                        fontSize: '14px'
                      }}>
                        {anexoInfo.description}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: anexoInfo.color
                      }}>
                        {anexoData.count}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#6c757d'
                      }}>
                        {anexoData.percentage}% del total
                      </div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '10px',
                    marginTop: '10px'
                  }}>
                    <div style={{
                      background: 'white',
                      padding: '8px',
                      borderRadius: '5px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {anexoData.density}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6c757d' }}>
                        negocios/km²
                      </div>
                    </div>
                    <div style={{
                      background: 'white',
                      padding: '8px',
                      borderRadius: '5px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {Object.keys(anexoData.types).length}
                      </div>
                      <div style={{ fontSize: '11px', color: '#6c757d' }}>
                        tipos diferentes
                      </div>
                    </div>
                  </div>

                  {/* Top tipos en este anexo */}
                  {Object.keys(anexoData.types).length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                        Principales tipos:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {Object.entries(anexoData.types)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([type, count]) => (
                            <span key={type} style={{
                              background: 'white',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              border: `1px solid ${anexoInfo.color}`
                            }}>
                              {type} ({count})
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Tipos de Negocio */}
        {activeTab === 'types' && (
          <div>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>
              🏢 Tipos de Negocio Más Comunes en San Antonio
            </h4>
            <div style={{ marginBottom: '20px' }}>
              {report.topBusinessTypes.map(([type, count], index) => {
                const percentage = ((count / report.summary.businessesInDistrict) * 100).toFixed(1);
                return (
                  <div key={type} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    marginBottom: '8px',
                    background: index === 0 ? '#fff3cd' : '#f8f9fa',
                    border: index === 0 ? '2px solid #ffeaa7' : '1px solid #e9ecef',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        background: index === 0 ? '#ffd93d' : '#6c757d',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                        {type}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{count}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Distribución por anexo */}
            <h5 style={{ margin: '20px 0 10px 0', color: '#495057' }}>
              📊 Distribución por Anexo
            </h5>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '10px'
            }}>
              {Object.entries(report.byAnexo).map(([anexoKey, anexoData]) => {
                const anexoInfo = SAN_ANTONIO_DISTRICT.anexos[anexoKey];
                return (
                  <div key={anexoKey} style={{
                    background: 'white',
                    border: `2px solid ${anexoInfo.color}`,
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: anexoInfo.color
                    }}>
                      {anexoData.count}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {anexoInfo.name.replace('San Antonio - ', '')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6c757d' }}>
                      {anexoData.percentage}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Recomendaciones */}
        {activeTab === 'recommendations' && (
          <div>
            <h4 style={{ margin: '0 0 15px 0', color: '#495057' }}>
              💡 Recomendaciones para el Distrito
            </h4>
            {report.recommendations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px',
                color: '#6c757d'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎉</div>
                <h5>¡Excelente trabajo!</h5>
                <p>No hay recomendaciones urgentes. El distrito está bien administrado.</p>
              </div>
            ) : (
              <div>
                {report.recommendations.map((rec, index) => (
                  <div key={index} style={{
                    padding: '15px',
                    marginBottom: '15px',
                    borderRadius: '8px',
                    border: `2px solid ${getPriorityColor(rec.priority)}`,
                    background: `${getPriorityColor(rec.priority)}15`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        background: getPriorityColor(rec.priority),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {rec.priority}
                      </span>
                      <h5 style={{ margin: 0, flex: 1 }}>{rec.title}</h5>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      color: '#6c757d',
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}>
                      {rec.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Estadísticas adicionales */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h5 style={{ margin: '0 0 10px 0' }}>📈 Métricas de Calidad</h5>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px'
              }}>
                <MetricItem
                  label="Cobertura Geográfica"
                  value={`${report.summary.coverage}%`}
                  good={parseFloat(report.summary.coverage) > 80}
                />
                <MetricItem
                  label="Datos Completos"
                  value={`${((report.coverage.withCoordinates / report.summary.totalBusinesses) * 100).toFixed(1)}%`}
                  good={report.coverage.withoutCoordinates < 5}
                />
                <MetricItem
                  label="Diversidad"
                  value={`${report.topBusinessTypes.length} tipos`}
                  good={report.topBusinessTypes.length >= 5}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 📊 Componente de tarjeta de estadística
const StatCard = ({ icon, title, value, subtitle, color = '#6c757d' }) => (
  <div style={{
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}>
    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
    <div style={{ 
      fontSize: '28px', 
      fontWeight: 'bold', 
      color: color,
      marginBottom: '5px'
    }}>
      {value}
    </div>
    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '3px' }}>
      {title}
    </div>
    <div style={{ fontSize: '12px', color: '#6c757d' }}>
      {subtitle}
    </div>
  </div>
);

// 📈 Componente de métrica
const MetricItem = ({ label, value, good }) => (
  <div style={{
    background: 'white',
    padding: '10px',
    borderRadius: '5px',
    textAlign: 'center',
    border: `2px solid ${good ? '#28a745' : '#ffc107'}`
  }}>
    <div style={{
      fontSize: '16px',
      fontWeight: 'bold',
      color: good ? '#28a745' : '#856404'
    }}>
      {value}
    </div>
    <div style={{ fontSize: '11px', color: '#6c757d' }}>
      {label}
    </div>
  </div>
);

// 🎨 Función para obtener color según prioridad
const getPriorityColor = (priority) => {
  const colors = {
    high: '#dc3545',
    medium: '#ffc107', 
    low: '#17a2b8'
  };
  return colors[priority] || '#6c757d';
};

export default DistrictInfoPanel;