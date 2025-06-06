import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');

  const handleSave = async () => {
    // Aquí implementarías la actualización del perfil
    console.log('Actualizando perfil:', { username });
    setEditing(false);
    // updateUser({ ...user, username });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>👤 Mi Perfil</h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nombre de usuario:
          </label>
          {editing ? (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          ) : (
            <p style={{ 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              margin: 0
            }}>
              {user?.username}
            </p>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Rol:
          </label>
          <p style={{ 
            padding: '10px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            margin: 0
          }}>
            {user?.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Fecha de registro:
          </label>
          <p style={{ 
            padding: '10px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            margin: 0
          }}>
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'No disponible'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {editing ? (
            <>
              <button
                onClick={handleSave}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                💾 Guardar
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setUsername(user?.username || '');
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✏️ Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;