import React from 'react';

const Footer = () => (
  <footer style={{
    background: '#263238',
    color: '#fff',
    textAlign: 'center',
    padding: '12px'
  }}>
    &copy; {new Date().getFullYear()} Pharmacy Management. All Rights Reserved.
  </footer>
);

export default Footer;