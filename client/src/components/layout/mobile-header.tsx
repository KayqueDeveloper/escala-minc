import React from 'react';
import { useLocation } from 'wouter';

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuToggle }) => {
  const [location] = useLocation();
  
  // Get page title based on location
  const getPageTitle = () => {
    switch (location) {
      case '/':
        return 'Dashboard';
      case '/schedules':
        return 'Escalas';
      case '/teams':
        return 'Times';
      case '/volunteers':
        return 'Voluntários';
      case '/swap-requests':
        return 'Solicitações de Troca';
      case '/notifications':
        return 'Notificações';
      case '/settings':
        return 'Configurações';
      default:
        return 'Scale';
    }
  };

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-primary z-10 shadow-md">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <button className="text-white mr-2" onClick={onMenuToggle}>
            <span className="material-icons">menu</span>
          </button>
          <h1 className="text-xl font-medium text-white">{getPageTitle()}</h1>
        </div>
        <div className="flex items-center">
          <button className="text-white relative mr-3">
            <span className="material-icons">notifications</span>
            <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
              3
            </span>
          </button>
          <img 
            src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&h=120&q=80" 
            alt="Profile" 
            className="w-8 h-8 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;
