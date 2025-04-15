import { BellIcon, MenuIcon } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('-translate-x-full');
      setSidebarVisible(!sidebarVisible);
    }
  };

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
          {subtitle && <p className="text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 relative">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-accent"></span>
          </button>
          <button 
            id="toggleSidebarBtn" 
            className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 lg:hidden"
            onClick={toggleSidebar}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
