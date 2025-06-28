// pages/UserManagement.jsx
import React, { useState } from 'react';
import { useUserManagement } from '../hooks/useUserManagement';
import UserPermissionsEditor from '../components/UserPermissionsEditor';

const UserManagement = () => {
  const {
    users,
    selectedUser,
    loading,
    error,
    updating,
    selectUser,
    updateUserPermissions,
    clearError
  } = useUserManagement();

  const [showCreateForm, setShowCreateForm] = useState(false);

  // ✅ MANEJAR SELECCIÓN DE USUARIO
  const handleUserSelect = (e) => {
    const userId = e.target.value;
    console.log('🔄 Selección de usuario cambiada:', userId);
    
    if (userId === '') {
      selectUser(null);
    } else {
      selectUser(parseInt(userId));
    }
  };

  // ✅ MANEJAR CAMBIOS DE PERMISOS
  const handlePermissionsChange = async (userId, newPermissions) => {
    console.log('💾 Guardando permisos para usuario:', userId);
    console.log('🔑 Permisos a guardar:', newPermissions);
    
    const result = await updateUserPermissions(userId, newPermissions);
    
    if (result.success) {
      // Mostrar mensaje de éxito o notificación
      console.log('✅ Permisos guardados correctamente');
    } else {
      // Mostrar error
      console.error('❌ Error guardando permisos:', result.error);
    }
    
    return result;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          👥 Gestión de Usuarios
        </h1>
        <p className="text-gray-600">
          Administra usuarios y sus permisos del sistema
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-500 text-xl mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de selección de usuarios */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Seleccionar Usuario
            </h2>
            
            {/* Selector de usuario */}
            <div className="mb-4">
              <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
                Usuario:
              </label>
              <select
                id="user-select"
                value={selectedUser?.id || ''}
                onChange={handleUserSelect}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={updating}
              >
                <option value="">-- Seleccionar usuario --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Información del usuario seleccionado */}
            {selectedUser && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="font-medium text-gray-900">Información del Usuario</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">ID:</span> {selectedUser.id}</p>
                  <p><span className="font-medium">Usuario:</span> {selectedUser.username}</p>
                  <p><span className="font-medium">Email:</span> {selectedUser.email || 'No definido'}</p>
                  <p><span className="font-medium">Nombre:</span> {selectedUser.full_name || 'No definido'}</p>
                  <p><span className="font-medium">Rol:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      selectedUser.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedUser.role}
                    </span>
                  </p>
                  <p><span className="font-medium">Estado:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      selectedUser.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </p>
                  <p><span className="font-medium">Permisos:</span> {selectedUser.permissions?.length || 0}</p>
                </div>
              </div>
            )}

            {/* Lista de usuarios */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Todos los Usuarios</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users.map(user => (
                  <div
                    key={user.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedUser?.id === user.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => selectUser(user.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {user.role === 'admin' && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">Admin</span>
                        )}
                        {!user.is_active && (
                          <span className="text-xs bg-red-100 text-red-800 px-1 rounded">Inactivo</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel de edición de permisos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <UserPermissionsEditor
              user={selectedUser}
              onPermissionsChange={handlePermissionsChange}
              isLoading={updating}
            />
          </div>
        </div>
      </div>

      {/* Panel de estadísticas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Estadísticas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-blue-800">Total Usuarios</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-purple-800">Administradores</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.is_active).length}
            </div>
            <div className="text-sm text-green-800">Usuarios Activos</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {users.filter(u => u.role === 'user').length}
            </div>
            <div className="text-sm text-orange-800">Usuarios Regular</div>
          </div>
        </div>
      </div>

      {/* Debug Panel - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && selectedUser && (
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">🐛 Debug Info</h3>
          <div className="text-xs font-mono bg-white p-3 rounded border overflow-auto">
            <p><strong>Usuario seleccionado:</strong></p>
            <pre>{JSON.stringify(selectedUser, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;