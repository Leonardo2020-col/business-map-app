import React from 'react';
import BusinessTable from '../components/BusinessTable/BusinessTable';
import Navbar from '../components/Navbar/Navbar';

const BusinessesPage = () => {
  return (
    <div className="businesses-page">
      <Navbar />
      <div className="businesses-content">
        <BusinessTable />
      </div>
    </div>
  );
};

export default BusinessesPage;