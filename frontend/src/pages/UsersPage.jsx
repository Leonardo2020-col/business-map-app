import React from 'react';
import Navbar from '../components/Navbar/Navbar';
import UserManagement from '../components/UserManagement/UserManagement';

const UsersPage = () => {
  return (
    <div className="users-page">
      <Navbar />
      <UserManagement />
    </div>
  );
};

export default UsersPage;