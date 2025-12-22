import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Simulate logout and redirect to login
    navigate('/login');
  }, [navigate]);

  return null;
};

export default Logout;
