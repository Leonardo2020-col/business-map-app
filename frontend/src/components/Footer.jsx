import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#f8f9fa',
      borderTop: '1px solid #dee2e6',
      padding: '20px',
      textAlign: 'center',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        color: '#6c757d',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0 0 10px 0' }}>
          © 2025 Business Map - Sistema de gestión de negocios
        </p>
        <p style={{ margin: 0 }}>
          Desarrollado usando React, Node.js y PostgreSQL
        </p>
      </div>
    </footer>
  );
};

export default Footer;