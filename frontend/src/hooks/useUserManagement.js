// hooks/useUserManagement.js
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  // ✅ CARGAR USUARIOS
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Cargando usuarios...');
      const response = await api.get('/admin/users');
      
      if (response.data.success) {
        const usersData = response.data.data;
        console.log('✅ Usuarios cargados:', usersData.length);
        setUsers(usersData);
      } else {
        throw new Error(response.data.message || 'Error cargando usuarios');
      }
    } catch (err) {
      console.error('❌ Error cargando usuarios:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ SELECCIONAR USUARIO
  const selectUser = useCallback((userId) => {
    console.log('👤 Seleccionando usuario:', userId);
    
    if (!userId) {
      setSelectedUser(null);
      return;
    }

    const user = users.find(u => u.id === parseInt(userId));
    if (user) {
      // ✅ CREAR COPIA COMPLETA DEL USUARIO PARA EVITAR REFERENCIAS COMPARTIDAS
      const userCopy = {
        ...user,
        permissions: Array.isArray(user.permissions) ? [...user.permissions] : []
      };
      
      console.log('✅ Usuario seleccionado:', userCopy.username);
      console.log('🔑 Permisos del usuario:', userCopy.permissions);
      setSelectedUser(userCopy);
    } else {
      console.warn('⚠️ Usuario no encontrado:', userId);
      setSelectedUser(null);
    }
  }, [users]);

  // ✅ ACTUALIZAR PERMISOS DE USUARIO
  const updateUserPermissions = useCallback(async (userId, newPermissions) => {
    setUpdating(true);
    setError(null);
    
    try {
      console.log('💾 Actualizando permisos del usuario:', userId);
      console.log('🔑 Nuevos permisos:', newPermissions);
      
      const response = await api.put(`/admin/users/${userId}`, {
        permissions: newPermissions
      });
      
      if (response.data.success) {
        const updatedUser = response.data.data;
        
        // ✅ ACTUALIZAR USUARIO EN LA LISTA
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...updatedUser, permissions: [...(updatedUser.permissions || [])] }
              : user
          )
        );
        
        // ✅ ACTUALIZAR USUARIO SELECCIONADO SI ES EL MISMO
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({
            ...updatedUser,
            permissions: [...(updatedUser.permissions || [])]
          });
        }
        
        console.log('✅ Permisos actualizados exitosamente');
        return { success: true };
        
      } else {
        throw new Error(response.data.message || 'Error actualizando permisos');
      }
      
    } catch (err) {
      console.error('❌ Error actualizando permisos:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  }, [selectedUser]);

  // ✅ CREAR USUARIO
  const createUser = useCallback(async (userData) => {
    setUpdating(true);
    setError(null);
    
    try {
      console.log('➕ Creando usuario:', userData.username);
      
      const response = await api.post('/admin/users', {
        ...userData,
        permissions: userData.permissions || []
      });
      
      if (response.data.success) {
        const newUser = response.data.data;
        
        // ✅ AGREGAR USUARIO A LA LISTA
        setUsers(prevUsers => [...prevUsers, {
          ...newUser,
          permissions: [...(newUser.permissions || [])]
        }]);
        
        console.log('✅ Usuario creado exitosamente');
        return { success: true, user: newUser };
        
      } else {
        throw new Error(response.data.message || 'Error creando usuario');
      }
      
    } catch (err) {
      console.error('❌ Error creando usuario:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  }, []);

  // ✅ ELIMINAR USUARIO
  const deleteUser = useCallback(async (userId) => {
    setUpdating(true);
    setError(null);
    
    try {
      console.log('🗑️ Eliminando usuario:', userId);
      
      const response = await api.delete(`/admin/users/${userId}`);
      
      if (response.data.success) {
        // ✅ REMOVER USUARIO DE LA LISTA
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        
        // ✅ LIMPIAR SELECCIÓN SI ES EL USUARIO ELIMINADO
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(null);
        }
        
        console.log('✅ Usuario eliminado exitosamente');
        return { success: true };
        
      } else {
        throw new Error(response.data.message || 'Error eliminando usuario');
      }
      
    } catch (err) {
      console.error('❌ Error eliminando usuario:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  }, [selectedUser]);

  // ✅ ACTUALIZAR USUARIO COMPLETO
  const updateUser = useCallback(async (userId, userData) => {
    setUpdating(true);
    setError(null);
    
    try {
      console.log('✏️ Actualizando usuario:', userId);
      
      const response = await api.put(`/admin/users/${userId}`, userData);
      
      if (response.data.success) {
        const updatedUser = response.data.data;
        
        // ✅ ACTUALIZAR USUARIO EN LA LISTA
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...updatedUser, permissions: [...(updatedUser.permissions || [])] }
              : user
          )
        );
        
        // ✅ ACTUALIZAR USUARIO SELECCIONADO SI ES EL MISMO
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser({
            ...updatedUser,
            permissions: [...(updatedUser.permissions || [])]
          });
        }
        
        console.log('✅ Usuario actualizado exitosamente');
        return { success: true, user: updatedUser };
        
      } else {
        throw new Error(response.data.message || 'Error actualizando usuario');
      }
      
    } catch (err) {
      console.error('❌ Error actualizando usuario:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setUpdating(false);
    }
  }, [selectedUser]);

  // ✅ LIMPIAR ERROR
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ CARGAR USUARIOS AL MONTAR EL COMPONENTE
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    // Estado
    users,
    selectedUser,
    loading,
    error,
    updating,
    
    // Acciones
    loadUsers,
    selectUser,
    updateUserPermissions,
    createUser,
    updateUser,
    deleteUser,
    clearError,
    
    // Helpers
    getUserById: useCallback((id) => users.find(u => u.id === parseInt(id)), [users]),
    isUserSelected: useCallback((id) => selectedUser?.id === parseInt(id), [selectedUser])
  };
};

// ✅ HOOK PARA GESTIÓN DE PERMISOS ESPECÍFICO
export const usePermissions = () => {
  const PERMISSION_DEFINITIONS = {
    'business:read': { label: 'Ver negocios', category: 'business', icon: '👁️' },
    'business:create': { label: 'Crear negocios', category: 'business', icon: '➕' },
    'business:edit': { label: 'Editar negocios', category: 'business', icon: '✏️' },
    'business:delete': { label: 'Eliminar negocios', category: 'business', icon: '🗑️' },
    'user:read': { label: 'Ver usuarios', category: 'users', icon: '👥' },
    'user:create': { label: 'Crear usuarios', category: 'users', icon: '👤' },
    'user:edit': { label: 'Editar usuarios', category: 'users', icon: '✏️' },
    'user:delete': { label: 'Eliminar usuarios', category: 'users', icon: '❌' },
    'admin:panel': { label: 'Panel de admin', category: 'admin', icon: '⚙️' },
    'reports:view': { label: 'Ver reportes', category: 'reports', icon: '📊' },
    'map:view': { label: 'Ver mapa', category: 'map', icon: '🗺️' }
  };

  const getPermissionLabel = useCallback((permissionId) => {
    return PERMISSION_DEFINITIONS[permissionId]?.label || permissionId;
  }, []);

  const getPermissionsByCategory = useCallback((category) => {
    return Object.entries(PERMISSION_DEFINITIONS)
      .filter(([_, def]) => def.category === category)
      .map(([id, def]) => ({ id, ...def }));
  }, []);

  const getAllPermissions = useCallback(() => {
    return Object.entries(PERMISSION_DEFINITIONS)
      .map(([id, def]) => ({ id, ...def }));
  }, []);

  const validatePermissions = useCallback((permissions) => {
    if (!Array.isArray(permissions)) return [];
    
    return permissions.filter(perm => 
      typeof perm === 'string' && PERMISSION_DEFINITIONS[perm]
    );
  }, []);

  return {
    PERMISSION_DEFINITIONS,
    getPermissionLabel,
    getPermissionsByCategory,
    getAllPermissions,
    validatePermissions
  };
};