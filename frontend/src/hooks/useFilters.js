import { useState, useMemo, useCallback } from 'react';
import { hasServiceIssues } from '../utils/dateUtils';

/**
 * Hook personalizado para manejo de filtros
 * @param {Array} data - Array de datos a filtrar
 * @param {Object} initialFilters - Filtros iniciales
 * @returns {Object} Estado y funciones para filtros
 */
export const useFilters = (data = [], initialFilters = {}) => {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    distrito: 'all',
    sector: 'all',
    anexo: 'all',
    service: 'all',
    ...initialFilters
  });

  /**
   * Datos filtrados memoizados
   */
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.filter(item => {
      // Filtro de búsqueda
      const matchesSearch = !filters.search || 
        (item.name && item.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.address && item.address.toLowerCase().includes(filters.search.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(filters.search.toLowerCase()));

      // Filtro por tipo
      const matchesType = filters.type === 'all' || 
        (item.business_type && item.business_type.toLowerCase().includes(filters.type.toLowerCase()));

      // Filtro por distrito
      const matchesDistrito = filters.distrito === 'all' || 
        (item.distrito && item.distrito.toLowerCase().includes(filters.distrito.toLowerCase()));

      // Filtro por sector
      const matchesSector = filters.sector === 'all' || 
        (item.sector && item.sector.toLowerCase().includes(filters.sector.toLowerCase()));

      // Filtro por anexo
      const matchesAnexo = filters.anexo === 'all' || 
        (item.anexo && item.anexo.toLowerCase().includes(filters.anexo.toLowerCase()));

      // Filtro por servicios
      const matchesService = filters.service === 'all' || 
        (filters.service === 'issues' && hasServiceIssues(item)) ||
        (filters.service === 'ok' && !hasServiceIssues(item));

      return matchesSearch && matchesType && matchesDistrito && matchesSector && matchesAnexo && matchesService;
    });
  }, [data, filters]);

  /**
   * Estadísticas de filtros memoizadas
   */
  const filterStats = useMemo(() => ({
    total: data.length,
    filtered: filteredData.length,
    hidden: data.length - filteredData.length
  }), [data.length, filteredData.length]);

  /**
   * Filtros activos
   */
  const activeFilters = useMemo(() => {
    const active = [];
    
    if (filters.search) {
      active.push({ key: 'search', label: `Búsqueda: "${filters.search}"`, value: filters.search });
    }
    
    if (filters.type !== 'all') {
      active.push({ key: 'type', label: `Tipo: ${filters.type}`, value: filters.type });
    }
    
    if (filters.distrito !== 'all') {
      active.push({ key: 'distrito', label: `Distrito: ${filters.distrito}`, value: filters.distrito });
    }
    
    if (filters.sector !== 'all') {
      active.push({ key: 'sector', label: `Sector: ${filters.sector}`, value: filters.sector });
    }
    
    if (filters.anexo !== 'all') {
      active.push({ key: 'anexo', label: `Anexo: ${filters.anexo}`, value: filters.anexo });
    }
    
    if (filters.service !== 'all') {
      const serviceLabels = {
        'issues': 'Con problemas',
        'ok': 'Todo al día'
      };
      active.push({ 
        key: 'service', 
        label: `Servicios: ${serviceLabels[filters.service]}`, 
        value: filters.service 
      });
    }
    
    return active;
  }, [filters]);

  /**
   * Actualizar un filtro específico
   */
  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  /**
   * Actualizar múltiples filtros
   */
  const setMultipleFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  /**
   * Limpiar todos los filtros
   */
  const clearAllFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      distrito: 'all',
      sector: 'all',
      anexo: 'all',
      service: 'all'
    });
  }, []);

  /**
   * Limpiar un filtro específico
   */
  const clearFilter = useCallback((key) => {
    const defaultValues = {
      search: '',
      type: 'all',
      distrito: 'all',
      sector: 'all',
      anexo: 'all',
      service: 'all'
    };

    setFilters(prev => ({
      ...prev,
      [key]: defaultValues[key] || ''
    }));
  }, []);

  /**
   * Verificar si hay filtros activos
   */
  const hasActiveFilters = useMemo(() => {
    return activeFilters.length > 0;
  }, [activeFilters]);

  /**
   * Obtener valores únicos para un campo
   */
  const getUniqueValues = useCallback((field) => {
    if (!Array.isArray(data)) return [];
    
    const values = data
      .map(item => item[field])
      .filter(value => value && value.trim() !== '')
      .map(value => value.trim());
    
    return [...new Set(values)].sort();
  }, [data]);

  return {
    // Estado
    filters,
    filteredData,
    filterStats,
    activeFilters,
    hasActiveFilters,

    // Acciones
    setFilter,
    setMultipleFilters,
    clearAllFilters,
    clearFilter,

    // Utilidades
    getUniqueValues
  };
};