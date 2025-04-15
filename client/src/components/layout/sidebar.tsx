import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [location] = useLocation();

  // Mock data for illustration
  const user = {
    name: "Carlos Silva",
    role: "Líder de Mídia",
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&h=120&q=80"
  };

  const teams = [
    { id: 1, name: "Equipe de Transmissão", color: "#3f51b5" },
    { id: 2, name: "Recepção", color: "#4caf50" }
  ];

  const menuItems = [
    { path: "/", label: "Dashboard", icon: "dashboard" },
    { path: "/schedules", label: "Escalas", icon: "event" },
    { path: "/teams", label: "Times", icon: "groups" },
    { path: "/volunteers", label: "Voluntários", icon: "person" },
    { path: "/swap-requests", label: "Solicitações de Troca", icon: "swap_horiz", badge: 3 },
    { path: "/notifications", label: "Notificações", icon: "notifications" },
    { path: "/settings", label: "Configurações", icon: "settings" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed md:static top-0 left-0 h-full w-64 bg-primary-dark text-white overflow-y-auto z-50 transition-transform duration-300 transform",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center border-b border-primary">
          <svg className="w-9 h-9 rounded-full mr-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2V6M8 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="text-xl font-medium">Scale</h1>
        </div>
        
        {/* User Profile Summary */}
        <div className="p-4 border-b border-primary flex items-center">
          <img src={user.avatar} alt="Profile" className="w-10 h-10 rounded-full mr-3" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs opacity-75">{user.role}</p>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="mt-3">
          <ul>
            {menuItems.map((item) => (
              <li 
                key={item.path}
                className={cn(
                  "px-4 py-2 hover:bg-primary transition-colors",
                  location === item.path && "bg-primary"
                )}
              >
                <Link href={item.path} className="flex items-center text-white">
                  <span className="material-icons mr-3 text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-secondary text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Teams Quick Access */}
        <div className="mt-8 px-4">
          <h3 className="text-sm font-medium mb-2 text-neutral-200">MEUS TIMES</h3>
          <ul>
            {teams.map((team) => (
              <li key={team.id} className="mb-1">
                <a href="#" className="flex items-center text-sm py-1 text-white hover:text-secondary-light">
                  <span 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: team.color }}
                  ></span>
                  <span>{team.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Logout */}
        <div className="mt-auto p-4 border-t border-primary">
          <button className="flex items-center text-white hover:text-secondary-light">
            <span className="material-icons mr-2">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
