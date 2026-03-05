import React from 'react';
import { User } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';
import Layout from './Layout';
import MobileLayout from './MobileLayout';

interface ResponsiveShellProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const ResponsiveShell: React.FC<ResponsiveShellProps> = ({ children, user, onLogout }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile) {
    return (
      <MobileLayout user={user} onLogout={onLogout}>
        {children}
      </MobileLayout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      {children}
    </Layout>
  );
};

export default ResponsiveShell;
