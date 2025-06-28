import React, { useState, useEffect } from 'react';

// ✅ LISTA DE PERMISOS DISPONIBLES
const AVAILABLE_PERMISSIONS = [
  { id: 'business:read', label: 'Ver negocios', icon: '👁️', category: 'business' },
  { id: 'business:create', label: 'Crear negocios', icon: '➕', category: 'business' },
  { id: 'business:edit', label: 'Editar negocios', icon: '✏️', category: 'business' },
  { id: 'business:delete', label: 'Eliminar negocios', icon: '🗑️', category: 'business' },
  { id: 'user:read', label: 'Ver usuarios', icon: '👥', category: 'users' },
  { id: 'user:create', label: 'Crear usuarios', icon: '👤', category: 'users' },
  { id: 'user:edit', label: 'Editar usuarios', icon: '✏️', category: 'users' },
  { id: 'user:delete', label: 'Eliminar usuarios', icon: '❌', category: 'users' },
  { id: 'admin:panel', label: 'Panel de admin', icon: '⚙️', category: 'admin' }
];

const UserPermissionsEditor = ({ user, onPermissionsChange, isLoading = false }) => {
  // ✅ ESTADO LOCAL PARA LOS PERMISOS DEL USUARIO ACTUAL
  const [localPermissions, setLocalPermissions] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  // ✅ SINCRONIZAR CON PROPS CUANDO CAMBIA EL USUARIO
  useEffect(() => {
    console.log('📝 Usuario cambió:', user?.username);
    console.log('🔑 Permisos del usuario:', user?.permissions);
    
    if (user?.permissions) {
      // Asegurar que sea un array
      const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
      setLocalPermissions([...userPerms]); // Crear nueva referencia
      setIsDirty(false);
      console.log('✅ Permisos locales actualizados:', userPerms);
    } else {
      setLocalPermissions([]);
      setIsDirty(false);
    }
  }, [user?.id, user?.permissions]); // ✅ Dependencias específicas

  // ✅ FUNCIÓN PARA MANEJAR CAMBIOS EN CHECKBOXES
  const handlePermissionChange = (permissionId, isChecked) => {
    console.log(`🔄 Cambio de permiso: ${permissionId} = ${isChecked}`);
    
    setLocalPermissions(prevPermissions => {
      let newPermissions;
      
      if (isChecked) {
        // Agregar permiso si no existe
        if (!prevPermissions.includes(permissionId)) {
          newPermissions = [...prevPermissions, permissionId];
        } else {
          newPermissions = prevPermissions;
        }
      } else {
        // Remover permiso
        newPermissions = prevPermissions.filter(p => p !== permissionId);
      }
      
      console.log('🔑 Nuevos permisos locales:', newPermissions);
      setIsDirty(true);
      return newPermissions;
    });
  };

  // ✅ FUNCIÓN PARA GUARDAR CAMBIOS
  const handleSave = async () => {
    if (!isDirty || !user) return;
    
    console.log('💾 Guardando permisos:', localPermissions);
    
    try {
      await onPermissionsChange(user.id, localPermissions);
      setIsDirty(false);
      console.log('✅ Permisos guardados exitosamente');
    } catch (error) {
      console.error('❌ Error guardando permisos:', error);
    }
  };

  // ✅ FUNCIÓN PARA CANCELAR CAMBIOS
  const handleCancel = () => {
    const originalPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
    setLocalPermissions([...originalPermissions]);
    setIsDirty(false);
    console.log('↩️ Cambios cancelados, restaurando:', originalPermissions);
  };

  // ✅ VERIFICAR SI UN PERMISO ESTÁ SELECCIONADO
  const isPermissionSelected = (permissionId) => {
    const isSelected = localPermissions.includes(permissionId);
    console.log(`🔍 Verificando permiso ${permissionId}: ${isSelected}`);
    return isSelected;
  };

  // No mostrar nada si no hay usuario seleccionado
  if (!user) {
    return (
      <div className="text-center text-gray-500 py-8">
        Selecciona un usuario para editar sus permisos
      </div>
    );
  }

  // Mostrar mensaje especial para administradores
  if (user.role === 'admin') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">👑</span>
          <h3 className="text-lg font-semibold text-blue-900">
            Permisos de Administrador
          </h3>
        </div>
        <p className="text-blue-700 mb-4">
          Los administradores tienen todos los permisos automáticamente.
        </p>
        <div className="bg-blue-100 rounded p-3">
          <span className="text-blue-800 font-medium">
            ✅ Acceso completo a todas las funciones del sistema
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🔒 Permisos Específicos
          </h3>
          <p className="text-sm text-gray-600">
            Usuario: <span className="font-medium">{user.username}</span>
          </p>
        </div>
        
        {/* Botones de acción */}
        {isDirty && (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {/* Mensaje informativo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          Los administradores tienen todos los permisos automáticamente
        </p>
      </div>

      {/* Lista de permisos por categoría */}
      <div className="space-y-6">
        {/* Permisos de Negocios */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            🏢 <span className="ml-2">Gestión de Negocios</span>
          </h4>
          <div className="space-y-3">
            {AVAILABLE_PERMISSIONS
              .filter(perm => perm.category === 'business')
              .map(permission => (
                <PermissionCheckbox
                  key={`${user.id}-${permission.id}`} // ✅ KEY ÚNICO POR USUARIO Y PERMISO
                  permission={permission}
                  isChecked={isPermissionSelected(permission.id)}
                  onChange={(isChecked) => handlePermissionChange(permission.id, isChecked)}
                  disabled={isLoading}
                />
              ))
            }
          </div>
        </div>

        {/* Permisos de Usuarios */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            👥 <span className="ml-2">Gestión de Usuarios</span>
          </h4>
          <div className="space-y-3">
            {AVAILABLE_PERMISSIONS
              .filter(perm => perm.category === 'users')
              .map(permission => (
                <PermissionCheckbox
                  key={`${user.id}-${permission.id}`} // ✅ KEY ÚNICO POR USUARIO Y PERMISO
                  permission={permission}
                  isChecked={isPermissionSelected(permission.id)}
                  onChange={(isChecked) => handlePermissionChange(permission.id, isChecked)}
                  disabled={isLoading}
                />
              ))
            }
          </div>
        </div>

        {/* Permisos de Administración */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            ⚙️ <span className="ml-2">Administración</span>
          </h4>
          <div className="space-y-3">
            {AVAILABLE_PERMISSIONS
              .filter(perm => perm.category === 'admin')
              .map(permission => (
                <PermissionCheckbox
                  key={`${user.id}-${permission.id}`} // ✅ KEY ÚNICO POR USUARIO Y PERMISO
                  permission={permission}
                  isChecked={isPermissionSelected(permission.id)}
                  onChange={(isChecked) => handlePermissionChange(permission.id, isChecked)}
                  disabled={isLoading}
                />
              ))
            }
          </div>
        </div>
      </div>

      {/* Debug info - Remover en producción */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 rounded p-3 text-xs">
          <strong>Debug Info:</strong><br/>
          Usuario ID: {user.id}<br/>
          Permisos originales: {JSON.stringify(user.permissions)}<br/>
          Permisos locales: {JSON.stringify(localPermissions)}<br/>
          Cambios pendientes: {isDirty ? 'Sí' : 'No'}
        </div>
      )}
    </div>
  );
};

// ✅ COMPONENTE INDIVIDUAL DE CHECKBOX
const PermissionCheckbox = ({ permission, isChecked, onChange, disabled = false }) => {
  const handleChange = (e) => {
    const checked = e.target.checked;
    console.log(`📋 Checkbox ${permission.id} cambió a: ${checked}`);
    onChange(checked);
  };

  return (
    <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
      <input
        type="checkbox"
        id={permission.id}
        checked={isChecked} // ✅ USAR PROP DIRECTAMENTE
        onChange={handleChange}
        disabled={disabled}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label 
        htmlFor={permission.id} 
        className="flex items-center cursor-pointer flex-1"
      >
        <span className="text-lg mr-2">{permission.icon}</span>
        <span className="text-sm font-medium text-gray-700">
          {permission.label}
        </span>
      </label>
    </div>
  );
};

export default UserPermissionsEditor;