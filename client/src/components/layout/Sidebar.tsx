import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Calendar, Users, Briefcase, Clock, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Escalas", href: "/schedules", icon: Calendar },
    { name: "Voluntários", href: "/volunteers", icon: Users },
    { name: "Times", href: "/teams", icon: Briefcase },
    { name: "Eventos", href: "/events", icon: Clock },
    { name: "Solicitações", href: "/requests", icon: MessageSquare, badge: true },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-800 text-white fixed inset-y-0 left-0 z-10 overflow-y-auto transition-transform duration-300 ease-in-out" id="sidebar">
      <div className="p-5">
        <div className="flex items-center mb-6">
          <div className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-xl font-bold">EscalaFácil</h1>
        </div>

        {user && (
          <div className="mb-4">
            <div className="flex items-center p-3 bg-slate-700 rounded-lg">
              <div className="w-10 h-10 rounded-full mr-3 bg-slate-600 flex items-center justify-center text-lg font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-slate-400">{user.role === 'admin' ? 'Administrador' : user.role === 'leader' ? 'Líder' : 'Voluntário'}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="mt-8">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  item.href === location
                    ? "flex items-center px-4 py-3 text-white bg-primary rounded-md group"
                    : "flex items-center px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-md group",
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
                {item.badge && item.href === '/requests' && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-accent rounded-full">3</span>
                )}
              </Link>
            ))}
          </div>
        </nav>
        
        <div className="mt-auto pt-6">
          <button 
            onClick={logout}
            className="w-full flex items-center px-4 py-3 text-slate-300 hover:bg-slate-700 rounded-md group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
