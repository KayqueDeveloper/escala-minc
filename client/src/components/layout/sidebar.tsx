import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  Users, 
  UserPlus, 
  Bell, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/sidebar-context";

type NavItemProps = {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

const NavItem = ({ href, icon: Icon, label, active, onClick }: NavItemProps) => {
  return (
    <Link href={href}>
      <a 
        onClick={onClick}
        className={cn(
          "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
          active 
            ? "bg-primary-50 text-primary-600" 
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <Icon 
          className={cn(
            "mr-3 h-6 w-6",
            active 
              ? "text-primary-600" 
              : "text-gray-400 group-hover:text-gray-500"
          )} 
        />
        {label}
      </a>
    </Link>
  );
};

export function Sidebar() {
  const [location] = useLocation();
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  const closeSidebar = () => setSidebarOpen(false);

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/schedules", icon: Calendar, label: "Escalas" },
    { href: "/volunteers", icon: Users, label: "Voluntários" },
    { href: "/teams", icon: UserPlus, label: "Times" },
    { href: "/events", icon: Calendar, label: "Eventos" },
    { href: "/notifications", icon: Bell, label: "Notificações" },
    { href: "/settings", icon: Settings, label: "Configurações" },
  ];

  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden bg-gray-600 bg-opacity-75"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 flex flex-col z-50 w-64 max-w-xs bg-white md:hidden transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <button 
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={closeSidebar}
          >
            <span className="sr-only">Fechar menu</span>
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex-shrink-0 flex items-center px-4">
            <span className="text-xl font-bold text-primary-600 font-heading">Escala Igreja</span>
          </div>
          <nav className="mt-5 px-2 space-y-1">
            {navItems.map((item) => (
              <NavItem 
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={location === item.href}
                onClick={closeSidebar}
              />
            ))}
          </nav>
        </div>

        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <a href="#" className="flex-shrink-0 group block">
            <div className="flex items-center">
              <div>
                <Avatar>
                  <AvatarImage src="" alt="User Profile" />
                  <AvatarFallback>LS</AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-3">
                <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">Líder Silva</p>
                <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700">Ver perfil</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <span className="text-xl font-bold text-primary-600 font-heading">Escala Igreja</span>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navItems.map((item) => (
                  <NavItem 
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={location === item.href}
                  />
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <a href="#" className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div>
                    <Avatar>
                      <AvatarImage src="" alt="User Profile" />
                      <AvatarFallback>LS</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Líder Silva</p>
                    <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">Ver perfil</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white shadow">
        <Button 
          variant="ghost" 
          size="icon" 
          className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Abrir menu</span>
          <Menu className="h-6 w-6 text-gray-500" />
        </Button>
        <span className="ml-2 text-lg font-bold text-primary-600">Escala Igreja</span>
      </div>
    </>
  );
}
