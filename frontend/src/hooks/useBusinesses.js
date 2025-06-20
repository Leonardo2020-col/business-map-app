import { useState, useEffect, useCallback } from 'react';
import { businessAPI } from '../services/api';

/**
 * Hook personalizado para gestionar negocios
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.loadOnMount - Cargar datos al montar (default: true)
 * @param {Object} options.initialFilters - Filtros iniciales
 * @param {number} options.limit - Límite de resultados (default: 50)
 * @returns {Object} Estado y funciones para gestionar negocios
 */
export const useBusinesses = (options = {}) => {
  const {
    loadOnMount = true,
    initialFilters = {},
    limit = 50
  } = options;

  // Estados principales
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    distrito: 'all',
    sector: 'all',
    anexo: 'all',
    service: 'all',
    ...initialFilters
  });

  // Estados para paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: limit,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Estados para estadísticas
  const [stats, setStats] = useState(null);

  /**
   * Cargar lista de negocios
   */
  const loadBusinesses = useCallback(async (customFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...customFilters
      };

      // Limpiar parámetros 'all'
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === 'all' || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      const response = await businessAPI.getAll(queryParams);
      const data = response.data;

      if (data.success) {
        setBusinesses(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else if (Array.isArray(data)) {
        setBusinesses(data);
      } else {
        setBusinesses([]);
        setError('Formato de datos inesperado');
      }

    } catch (err) {
      console.error('Error cargando negocios:', err);
      setError(err.response?.data?.message || 'Error al cargar los negocios');
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  /**
   * Cargar estadísticas
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await businessAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  /**
   * Crear nuevo negocio
   */
  const createBusiness = useCallback(async (businessData) => {
    try {
      setLoading(true);
      const response = await businessAPI.create(businessData);
      
      if (response.data.success) {
        // Recargar lista después de crear
        await loadBusinesses();
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al crear negocio');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBusinesses]);

  /**
   * Actualizar negocio existente
   */
  const updateBusiness = useCallback(async (id, businessData) => {
    try {
      setLoading(true);
      const response = await businessAPI.update(id, businessData);
      
      if (response.data.success) {
        // Actualizar en la lista local
        setBusinesses(prev => 
          prev.map(business => 
            business.id === id ? { ...business, ...businessData } : business
          )
        );
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Error al actualizar negocio');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Eliminar negocio
   */
  const deleteBusiness = useCallback(async (id) => {
    try {
      setLoading(true);
      await businessAPI.delete(id);
      
      // Remover de la lista local
      setBusinesses(prev => prev.filter(business => business.id !== id));
      
      // Actualizar estadísticas si están cargadas
      if (stats) {
        await loadStats();
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar negocio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [stats, loadStats]);

  /**
   * Obtener negocio por ID
   */
  const getBusinessById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await businessAPI.getById(id);
      return response.data.success ? response.data.data : response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar negocio');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Actualizar filtros
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset a página 1
  }, []);

  /**
   * Limpiar filtros
   */
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      distrito: 'all',
      sector: 'all',
      anexo: 'all',
      service: 'all'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Cambiar página
   */
  const changePage = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refrescar datos
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadBusinesses(),
      loadStats()
    ]);
  }, [loadBusinesses, loadStats]);

  // Cargar datos iniciales
  useEffect(() => {
    if (loadOnMount) {
      loadBusinesses();
    }
  }, [loadOnMount, loadBusinesses]);

  // Recargar cuando cambien los filtros o la página
  useEffect(() => {
    if (loadOnMount) {
      loadBusinesses();
    }
  }, [filters, pagination.page, loadBusinesses, loadOnMount]);

  return {
    // Datos
    businesses,
    stats,
    loading,
    error,
    filters,
    pagination,

    // Acciones
    loadBusinesses,
    loadStats,
    createBusiness,
    updateBusiness,
    deleteBusiness,
    getBusinessById,
    
    // Filtros y paginación
    updateFilters,
    clearFilters,
    changePage,
    
    // Utilidades
    clearError,
    refresh
  };
};