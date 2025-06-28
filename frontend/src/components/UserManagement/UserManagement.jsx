import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserManagement.css';

// ✅ CONSTANTES EXTRAÍDAS
const AVAILABLE_PERMISSIONS = {
  'businesses_view': '👁️ Ver negocios',
  'businesses_create': '➕ Crear negocios',
  'businesses_edit': '✏️ Editar negocios',
  'businesses_delete': '🗑️ Eliminar negocios',
  'users_view': '👥 Ver usuarios',
  'users_create': '👤 Crear usuarios',
  'users_edit': '✏️ Editar usuarios',
  'users_delete': '❌ Eliminar usuarios',
  'admin_panel': '⚙️ Panel de admin',
  'reports_view': '📊 Ver reportes',
  'map_view': '🗺️ Ver mapa'
};

// ✅ MAPEO DE PERMISOS: Base de datos -> Frontend
const PERMISSION_MAPPING = {
  // Permisos de negocios
  'business:read': 'businesses_view',
  'business:create': 'businesses_create',
  'business:edit': 'businesses_edit',
  'business:delete': 'businesses_delete',
  
  // Permisos de usuarios
  'user:read': 'users_view',
  'user:create': 'users_create',
  'user:edit': 'users_edit',
  'user:delete': 'users_delete',
  
  // Permisos adicionales
  'admin:panel': 'admin_panel',
  'reports:view': 'reports_view',
  'map:view': 'map_view',
  
  // También mantener compatibilidad con nombres nuevos
  'businesses_view': 'businesses_view',
  'businesses_create': 'businesses_create',
  'businesses_edit': 'businesses_edit',
  'businesses_delete': 'businesses_delete',
  'users_view': 'users_view',
  'users_create': 'users_create',
  'users_edit': 'users_edit',
  'users_delete': 'users_delete',
  'admin_panel': 'admin_panel',
  'reports_view': 'reports_view',
  'map_view': 'map_view'
};

const INITIAL_FORM_DATA = {
  username: '',
  email: '',
  full_name: '',
  password: '',
  role: 'user',
  is_active: true
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Estados para filtros
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para formularios
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [userPermissions, setUserPermissions] = useState({});

  // ✅ MEMOIZACIÓN DE USUARIOS FILTRADOS
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && user.is_active) ||
        (filterStatus === 'inactive' && !user.is_active);
      const matchesSearch = !searchTerm || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, filterRole, filterStatus, searchTerm]);

  // ✅ ESTADÍSTICAS MEMOIZADAS
  const userStats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
    displayed: filteredUsers.length
  }), [users, filteredUsers]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  // ✅ FUNCIONES OPTIMIZADAS CON useCallback
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Debug - Cargando usuarios desde /api/admin/users');
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      
      const data = await response.json();
      console.log('🔍 Debug - Respuesta completa del servidor al cargar usuarios:', data);
      console.log('🔍 Debug - Usuarios recibidos:', data.data || []);
      
      // Log específico de permisos para cada usuario
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach(user => {
          console.log(`🔍 Debug - Usuario ${user.username} (ID: ${user.id}):`, {
            permissions: user.permissions,
            permissions_count: user.permissions_count
          });
        });
      }
      
      setUsers(data.data || []);
      
    } catch (err) {
      setError('Error al cargar la lista de usuarios');
      console.error('❌ Debug - Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setUserPermissions({});
  }, []);

  const handleCreateUser = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      
      // Convertir permisos del frontend al formato de la base de datos
      // Solo incluir los permisos que están marcados como true
      const selectedFrontendPermissions = Object.keys(userPermissions).filter(perm => userPermissions[perm]);
      
      const dbPermissions = selectedFrontendPermissions.map(frontendPerm => {
        // Buscar el permiso de BD que corresponde a este permiso de frontend
        const dbPerm = Object.keys(PERMISSION_MAPPING).find(dbKey => 
          PERMISSION_MAPPING[dbKey] === frontendPerm
        );
        return dbPerm || frontendPerm; // Fallback al nombre original si no se encuentra
      });
      
      console.log('🔍 Debug - Permisos frontend seleccionados:', selectedFrontendPermissions);
      console.log('🔍 Debug - Permisos para BD (crear):', dbPermissions);
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          permissions: dbPermissions
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear usuario');
      }
      
      setSuccess('✅ Usuario creado exitosamente');
      setShowCreateModal(false);
      resetForm();
      loadUsers();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(`❌ ${err.message}`);
    }
  }, [formData, userPermissions, resetForm, loadUsers]);

  const handleEditUser = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // No actualizar password si está vacío
      }
      
      // Convertir permisos del frontend al formato de la base de datos
      // Solo incluir los permisos que están marcados como true
      const selectedFrontendPermissions = Object.keys(userPermissions).filter(perm => userPermissions[perm]);
      
      const dbPermissions = selectedFrontendPermissions.map(frontendPerm => {
        // Buscar el permiso de BD que corresponde a este permiso de frontend
        const dbPerm = Object.keys(PERMISSION_MAPPING).find(dbKey => 
          PERMISSION_MAPPING[dbKey] === frontendPerm
        );
        return dbPerm || frontendPerm; // Fallback al nombre original si no se encuentra
      });
      
      // Preparar el payload completo
      const payload = {
        ...updateData,
        permissions: dbPermissions
      };
      
      console.log('🔍 Debug - Estado completo userPermissions:', userPermissions);
      console.log('🔍 Debug - Permisos frontend seleccionados:', selectedFrontendPermissions);
      console.log('🔍 Debug - Permisos para BD (editar):', dbPermissions);
      console.log('🔍 Debug - Payload completo enviado al backend:', JSON.stringify(payload, null, 2));
      console.log('🔍 Debug - URL del endpoint:', `/api/admin/users/${selectedUser.id}`);
      
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('🔍 Debug - Respuesta del servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Debug - Error del servidor:', errorData);
        throw new Error(errorData.message || 'Error al actualizar usuario');
      }
      
      // Leer la respuesta exitosa del servidor
      const responseData = await response.json();
      console.log('✅ Debug - Respuesta exitosa del servidor:', responseData);
      
      setSuccess('✅ Usuario actualizado exitosamente');
      setShowEditModal(false);
      resetForm();
      setSelectedUser(null);
      
      // Recargar usuarios después de un pequeño delay para asegurar que la BD se actualice
      setTimeout(() => {
        loadUsers();
      }, 500);
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('❌ Debug - Error completo:', err);
      setError(`❌ ${err.message}`);
    }
  }, [formData, userPermissions, selectedUser, resetForm, loadUsers]);

  const handleDeleteUser = useCallback(async (userId, username) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"?`)) {
      return;
    }
    
    try {
      setError('');
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }
      
      setSuccess('✅ Usuario eliminado exitosamente');
      loadUsers();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(`❌ ${err.message}`);
    }
  }, [loadUsers]);

  // ✅ FUNCIÓN MEJORADA PARA PROCESAR PERMISOS DE USUARIO
  const processUserPermissions = useCallback((user) => {
    const currentPermissions = {};
    
    console.log('🔍 Debug - Usuario completo:', JSON.stringify(user, null, 2));
    console.log('🔍 Debug - Tipo de permisos:', typeof user.permissions);
    console.log('🔍 Debug - Permisos del usuario:', user.permissions);
    console.log('🔍 Debug - PERMISSION_MAPPING:', PERMISSION_MAPPING);
    
    if (user.permissions) {
      let permissionsArray = [];
      
      // Manejar diferentes formatos de permisos
      if (Array.isArray(user.permissions)) {
        console.log('🔍 Debug - Permisos son array');
        permissionsArray = user.permissions;
      } else if (typeof user.permissions === 'string') {
        console.log('🔍 Debug - Permisos son string');
        if (user.permissions.startsWith('[') || user.permissions.startsWith('{')) {
          try {
            // Si es un string JSON, parsearlo
            const parsed = JSON.parse(user.permissions);
            permissionsArray = Array.isArray(parsed) ? parsed : Object.keys(parsed).filter(key => parsed[key]);
            console.log('🔍 Debug - Permisos parseados desde JSON:', permissionsArray);
          } catch (e) {
            console.log('🔍 Debug - Error parseando JSON:', e);
            permissionsArray = [];
          }
        } else {
          // Si no es JSON válido, dividir por comas
          permissionsArray = user.permissions.split(',').map(p => p.trim()).filter(p => p);
          console.log('🔍 Debug - Permisos divididos por coma:', permissionsArray);
        }
      } else if (typeof user.permissions === 'object' && user.permissions !== null) {
        console.log('🔍 Debug - Permisos son objeto');
        // Si es un objeto, extraer las claves que tienen valor true
        permissionsArray = Object.keys(user.permissions).filter(key => user.permissions[key]);
      }
      
      console.log('🔍 Debug - Permisos procesados (array):', permissionsArray);
      
      // Marcar permisos activos usando el mapeo
      permissionsArray.forEach(perm => {
        // Limpiar el permiso de espacios y caracteres raros
        const cleanPerm = typeof perm === 'string' ? perm.trim() : String(perm).trim();
        console.log(`🔍 Debug - Procesando permiso: "${cleanPerm}"`);
        
        // Buscar el permiso en el mapeo
        const mappedPermission = PERMISSION_MAPPING[cleanPerm];
        if (mappedPermission) {
          currentPermissions[mappedPermission] = true;
          console.log(`✅ Debug - Permiso "${cleanPerm}" mapeado a "${mappedPermission}" y marcado como true`);
        } else {
          console.log(`❌ Debug - Permiso "${cleanPerm}" NO encontrado en PERMISSION_MAPPING`);
          console.log('🔍 Debug - Mapeos disponibles:', Object.keys(PERMISSION_MAPPING));
        }
      });
    } else {
      console.log('🔍 Debug - Usuario sin permisos');
    }
    
    console.log('🔍 Debug - Permisos finales:', currentPermissions);
    return currentPermissions;
  }, []);

  // ✅ FUNCIÓN MEJORADA PARA ABRIR MODAL DE EDICIÓN
  const openEditModal = useCallback(async (user) => {
    console.log('🔍 Debug - Abriendo modal para usuario:', user);
    
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      full_name: user.full_name || '',
      password: '', // No mostrar password actual
      role: user.role,
      is_active: user.is_active
    });
    
    // Siempre cargar los permisos detallados desde la API
    let userWithPermissions = user;
    
    try {
      console.log('🔍 Debug - Cargando permisos desde API para usuario ID:', user.id);
      const response = await fetch(`/api/admin/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        userWithPermissions = userData.data || userData;
        console.log('🔍 Debug - Respuesta completa de la API:', JSON.stringify(userData, null, 2));
        console.log('🔍 Debug - Usuario con permisos desde API:', userWithPermissions);
      } else {
        console.log('❌ Debug - Error en respuesta de API:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('❌ Debug - Error text:', errorText);
      }
    } catch (error) {
      console.error('❌ Debug - Error cargando permisos del usuario:', error);
    }
    
    // Procesar permisos del usuario
    const currentPermissions = processUserPermissions(userWithPermissions);
    console.log('🔍 Debug - Estableciendo permisos en estado:', currentPermissions);
    setUserPermissions(currentPermissions);
    
    // Pequeño delay para asegurar que el estado se actualice antes de abrir el modal
    setTimeout(() => {
      setShowEditModal(true);
    }, 100);
  }, [processUserPermissions]);

  const openCreateModal = useCallback(() => {
    resetForm();
    setShowCreateModal(true);
  }, [resetForm]);

  const handlePermissionChange = useCallback((permission) => {
    console.log(`🔍 Debug - Cambiando permiso: ${permission}`);
    console.log(`🔍 Debug - Estado actual del permiso: ${userPermissions[permission]}`);
    
    setUserPermissions(prev => {
      const newState = {
        ...prev,
        [permission]: !prev[permission]
      };
      console.log(`🔍 Debug - Nuevo estado del permiso ${permission}: ${newState[permission]}`);
      console.log(`🔍 Debug - Nuevo estado completo:`, newState);
      return newState;
    });
  }, [userPermissions]);

  // ✅ FUNCIÓN HELPER PARA FORMATEAR FECHA
  const formatLastLogin = useCallback((lastLogin) => {
    if (!lastLogin) return 'Nunca';
    return new Date(lastLogin).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // ✅ FUNCIONES HELPER PARA CERRAR MODALES
  const closeCreateModal = useCallback(() => setShowCreateModal(false), []);
  const closeEditModal = useCallback(() => setShowEditModal(false), []);

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner">🔄</div>
        <p>Cargando gestión de usuarios...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div>
          <h1>👥 Gestión de Usuarios</h1>
          <p>Administra usuarios y sus permisos en el sistema</p>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            ➕ Crear Usuario
          </button>
          <button 
            onClick={loadUsers}
            className="btn btn-secondary"
            disabled={loading}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="user-filters">
        <div className="filter-group">
          <label>🔍 Buscar:</label>
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label>👤 Rol:</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuarios</option>
          </select>
        </div>

        <div className="filter-group">
          <label>📊 Estado:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* ✅ ESTADÍSTICAS OPTIMIZADAS */}
      <div className="user-stats">
        <div className="stat-card">
          <div className="stat-number">{userStats.total}</div>
          <div className="stat-label">Total Usuarios</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{userStats.active}</div>
          <div className="stat-label">Activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{userStats.admins}</div>
          <div className="stat-label">Administradores</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{userStats.displayed}</div>
          <div className="stat-label">Mostrados</div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Información</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Permisos</th>
              <th>Último Acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className={!user.is_active ? 'user-inactive' : ''}>
                <td>
                  <div className="user-basic">
                    <strong>{user.username}</strong>
                    <small>ID: {user.id}</small>
                  </div>
                </td>
                <td>
                  <div className="user-info">
                    {user.full_name && <div>📝 {user.full_name}</div>}
                    {user.email && <div>📧 {user.email}</div>}
                  </div>
                </td>
                <td>
                  <span className={`role-badge role-${user.role}`}>
                    {user.role === 'admin' ? '👑 Admin' : '👤 Usuario'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? '✅ Activo' : '❌ Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="permissions-summary">
                    {user.role === 'admin' ? (
                      <span className="all-permissions">🔑 Todos</span>
                    ) : (
                      <span className="permission-count">
                        {user.permissions_count || 0} permisos
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <small>{formatLastLogin(user.last_login)}</small>
                </td>
                <td>
                  <div className="user-actions">
                    <button
                      onClick={() => openEditModal(user)}
                      className="btn btn-edit"
                      title="Editar usuario"
                    >
                      ✏️
                    </button>
                    {user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        className="btn btn-delete"
                        title="Eliminar usuario"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No se encontraron usuarios</h3>
            <p>Ajusta los filtros o crea un nuevo usuario.</p>
          </div>
        )}
      </div>

      {/* ✅ MODALES EXTRAÍDOS A COMPONENTES SEPARADOS */}
      {showCreateModal && (
        <CreateUserModal
          formData={formData}
          userPermissions={userPermissions}
          availablePermissions={AVAILABLE_PERMISSIONS}
          onInputChange={handleInputChange}
          onPermissionChange={handlePermissionChange}
          onSubmit={handleCreateUser}
          onClose={closeCreateModal}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          selectedUser={selectedUser}
          currentUser={currentUser}
          formData={formData}
          userPermissions={userPermissions}
          availablePermissions={AVAILABLE_PERMISSIONS}
          onInputChange={handleInputChange}
          onPermissionChange={handlePermissionChange}
          onSubmit={handleEditUser}
          onClose={closeEditModal}
        />
      )}
    </div>
  );
};

// ✅ COMPONENTE MODAL CREAR USUARIO
const CreateUserModal = ({ 
  formData, 
  userPermissions, 
  availablePermissions,
  onInputChange, 
  onPermissionChange, 
  onSubmit, 
  onClose 
}) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h2>➕ Crear Nuevo Usuario</h2>
        <button onClick={onClose} className="modal-close">✕</button>
      </div>

      <form onSubmit={onSubmit} className="user-form">
        <UserFormFields 
          formData={formData}
          onInputChange={onInputChange}
          isEditing={false}
        />

        {formData.role !== 'admin' && (
          <PermissionsSection
            userPermissions={userPermissions}
            availablePermissions={availablePermissions}
            onPermissionChange={onPermissionChange}
          />
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            ❌ Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            ➕ Crear Usuario
          </button>
        </div>
      </form>
    </div>
  </div>
);

// ✅ COMPONENTE MODAL EDITAR USUARIO
const EditUserModal = ({ 
  selectedUser,
  currentUser,
  formData, 
  userPermissions, 
  availablePermissions,
  onInputChange, 
  onPermissionChange, 
  onSubmit, 
  onClose 
}) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h2>✏️ Editar Usuario: {selectedUser.username}</h2>
        <button onClick={onClose} className="modal-close">✕</button>
      </div>

      <form onSubmit={onSubmit} className="user-form">
        <UserFormFields 
          formData={formData}
          onInputChange={onInputChange}
          isEditing={true}
          selectedUser={selectedUser}
          currentUser={currentUser}
        />

        {formData.role !== 'admin' && (
          <PermissionsSection
            userPermissions={userPermissions}
            availablePermissions={availablePermissions}
            onPermissionChange={onPermissionChange}
          />
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            ❌ Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            💾 Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  </div>
);

// ✅ COMPONENTE CAMPOS DEL FORMULARIO
const UserFormFields = ({ formData, onInputChange, isEditing, selectedUser, currentUser }) => (
  <div className="form-section">
    <h3>📋 Información Básica</h3>
    
    <div className="form-row">
      <div className="form-group">
        <label htmlFor={`${isEditing ? 'edit_' : ''}username`}>👤 Nombre de Usuario:</label>
        <input
          type="text"
          id={`${isEditing ? 'edit_' : ''}username`}
          name="username"
          value={formData.username}
          onChange={onInputChange}
          placeholder="usuario123"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor={`${isEditing ? 'edit_' : ''}email`}>📧 Email:</label>
        <input
          type="email"
          id={`${isEditing ? 'edit_' : ''}email`}
          name="email"
          value={formData.email}
          onChange={onInputChange}
          placeholder="usuario@email.com"
        />
      </div>
    </div>

    <div className="form-group">
      <label htmlFor={`${isEditing ? 'edit_' : ''}full_name`}>📝 Nombre Completo:</label>
      <input
        type="text"
        id={`${isEditing ? 'edit_' : ''}full_name`}
        name="full_name"
        value={formData.full_name}
        onChange={onInputChange}
        placeholder="Juan Pérez García"
      />
    </div>

    <div className="form-row">
      <div className="form-group">
        <label htmlFor={`${isEditing ? 'edit_' : ''}password`}>🔒 {isEditing ? 'Nueva ' : ''}Contraseña:</label>
        <input
          type="password"
          id={`${isEditing ? 'edit_' : ''}password`}
          name="password"
          value={formData.password}
          onChange={onInputChange}
          placeholder={isEditing ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
          required={!isEditing}
        />
        {isEditing && (
          <small>Dejar vacío si no quieres cambiar la contraseña</small>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={`${isEditing ? 'edit_' : ''}role`}>👑 Rol:</label>
        <select
          id={`${isEditing ? 'edit_' : ''}role`}
          name="role"
          value={formData.role}
          onChange={onInputChange}
          disabled={isEditing && selectedUser?.id === currentUser?.id}
        >
          <option value="user">👤 Usuario</option>
          <option value="admin">👑 Administrador</option>
        </select>
        {isEditing && selectedUser?.id === currentUser?.id && (
          <small>No puedes cambiar tu propio rol</small>
        )}
      </div>
    </div>

    <div className="form-group">
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={onInputChange}
          disabled={isEditing && selectedUser?.id === currentUser?.id}
        />
        ✅ Usuario activo
        {isEditing && selectedUser?.id === currentUser?.id && (
          <small>No puedes desactivarte a ti mismo</small>
        )}
      </label>
    </div>
  </div>
);

// ✅ COMPONENTE SECCIÓN DE PERMISOS MEJORADO
const PermissionsSection = ({ userPermissions, availablePermissions, onPermissionChange }) => {
  console.log('🔍 Debug - PermissionsSection renderizando...');
  console.log('🔍 Debug - userPermissions recibidos:', userPermissions);
  
  // Verificar si userPermissions es un objeto válido
  const isValidPermissions = userPermissions && typeof userPermissions === 'object';
  console.log('🔍 Debug - ¿Permisos válidos?:', isValidPermissions);
  
  if (!isValidPermissions) {
    console.log('⚠️ Debug - userPermissions no es válido, usando objeto vacío');
  }
  
  return (
    <div className="form-section">
      <h3>🔐 Permisos Específicos</h3>
      <p className="permissions-note">
        Los administradores tienen todos los permisos automáticamente
      </p>
      
      <div className="permissions-grid">
        {Object.entries(availablePermissions).map(([perm, label]) => {
          const isChecked = isValidPermissions ? Boolean(userPermissions[perm]) : false;
          console.log(`🔍 Debug - Permiso ${perm}: ${isChecked} (valor raw: ${userPermissions[perm]})`);
          
          return (
            <label key={perm} className="permission-item">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {
                  console.log(`🔍 Debug - Click en permiso ${perm}, estado actual: ${isChecked}`);
                  onPermissionChange(perm);
                }}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
      
      {/* Debug info - remover en producción */}
      <div style={{background: '#f0f0f0', padding: '10px', marginTop: '10px', fontSize: '12px', fontFamily: 'monospace'}}>
        <strong>🐛 Debug Info:</strong><br/>
        userPermissions: {JSON.stringify(userPermissions)}<br/>
        Permisos marcados: {Object.entries(userPermissions || {}).filter(([k,v]) => v).map(([k]) => k).join(', ') || 'ninguno'}<br/>
        Total checkboxes marcados: {Object.values(userPermissions || {}).filter(v => v).length}
      </div>
    </div>
  );
};

export default UserManagement;