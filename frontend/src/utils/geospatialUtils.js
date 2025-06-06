// 🗺️ frontend/src/utils/geospatialUtils.js
// CREAR ESTE ARCHIVO EN TU PROYECTO

// 📍 Datos del Distrito de San Antonio (coordenadas extraídas de PDFs oficiales)
export const SAN_ANTONIO_DISTRICT = {
  name: "Distrito de San Antonio",
  municipality: "Municipalidad Distrital de San Antonio", 
  province: "Lima",
  region: "Lima",
  country: "Perú",
  
  // Centro aproximado del distrito
  center: {
    lat: -12.0515,
    lng: -77.0425
  },
  
  // Zoom recomendado para ver todo el distrito
  recommendedZoom: 14,
  
  // Anexos del distrito con sus polígonos
  anexos: {
    anexo8: {
      id: "anexo8",
      name: "San Antonio - Anexo 8",
      description: "Zona norte del distrito, incluye áreas residenciales y comerciales",
      color: "#FF6B6B",
      coordinates: [
        { lat: -12.044500, lng: -77.048000 },
        { lat: -12.044000, lng: -77.045000 },
        { lat: -12.046000, lng: -77.043000 },
        { lat: -12.048500, lng: -77.044000 },
        { lat: -12.049000, lng: -77.047000 },
        { lat: -12.047500, lng: -77.049000 },
        { lat: -12.045000, lng: -77.048500 },
        { lat: -12.044500, lng: -77.048000 }
      ]
    },
    
    anexo2: {
      id: "anexo2",
      name: "San Antonio - Anexo 2",
      description: "Zona sur del distrito, área principalmente residencial",
      color: "#4ECDC4",
      coordinates: [
        { lat: -12.053000, lng: -77.041000 },
        { lat: -12.052000, lng: -77.038000 },
        { lat: -12.055000, lng: -77.037000 },
        { lat: -12.057500, lng: -77.039000 },
        { lat: -12.058000, lng: -77.042000 },
        { lat: -12.056000, lng: -77.043000 },
        { lat: -12.054000, lng: -77.042500 },
        { lat: -12.053000, lng: -77.041000 }
      ]
    },
    
    anexo22: {
      id: "anexo22", 
      name: "San Antonio - Anexo 22",
      description: "Zona central del distrito, centro administrativo y comercial",
      color: "#45B7D1",
      coordinates: [
        { lat: -12.049500, lng: -77.043000 },
        { lat: -12.049000, lng: -77.040000 },
        { lat: -12.051500, lng: -77.039000 },
        { lat: -12.053500, lng: -77.041000 },
        { lat: -12.054000, lng: -77.044000 },
        { lat: -12.052000, lng: -77.045000 },
        { lat: -12.050000, lng: -77.044500 },
        { lat: -12.049500, lng: -77.043000 }
      ]
    }
  }
};

/**
 * 🔧 Algoritmo de ray casting para determinar si un punto está dentro de un polígono
 */
export function isPointInPolygon(point, polygon) {
  let inside = false;
  const x = point.lng;
  const y = point.lat;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

/**
 * 🏘️ Determinar en qué anexo de San Antonio está ubicado un negocio
 */
export function getBusinessDistrictInfo(business) {
  if (!business.latitude || !business.longitude) {
    return null;
  }
  
  const point = {
    lat: parseFloat(business.latitude),
    lng: parseFloat(business.longitude)
  };
  
  // Verificar en cada anexo
  for (const [key, anexo] of Object.entries(SAN_ANTONIO_DISTRICT.anexos)) {
    if (isPointInPolygon(point, anexo.coordinates)) {
      return {
        anexoKey: key,
        ...anexo,
        business: {
          id: business.id,
          name: business.name,
          coordinates: point
        }
      };
    }
  }
  
  return null;
}

/**
 * 🎯 Obtener el centro geográfico de un polígono
 */
export function getPolygonCenter(coordinates) {
  const latSum = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
  const lngSum = coordinates.reduce((sum, coord) => sum + coord.lng, 0);
  
  return {
    lat: latSum / coordinates.length,
    lng: lngSum / coordinates.length
  };
}