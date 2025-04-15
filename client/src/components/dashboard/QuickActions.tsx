import { PlusIcon, UserPlusIcon, CalendarIcon, MessageSquareIcon } from "lucide-react";
import { NewScheduleModal } from "@/components/modals/NewScheduleModal";
import { useState } from "react";
import { useLocation } from "wouter";

export default function QuickActions() {
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [location, setLocation] = useLocation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div 
        className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowNewScheduleModal(true)}
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
            <PlusIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-slate-700">Nova Escala</h3>
            <p className="text-sm text-slate-500">Criar escalação</p>
          </div>
        </div>
      </div>
      
      <div 
        className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setLocation('/volunteers')}
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
            <UserPlusIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-slate-700">Add Voluntário</h3>
            <p className="text-sm text-slate-500">Cadastrar pessoa</p>
          </div>
        </div>
      </div>
      
      <div 
        className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setLocation('/events')}
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-purple-100 text-purple-600 mr-4">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-slate-700">Novo Evento</h3>
            <p className="text-sm text-slate-500">Agendar evento</p>
          </div>
        </div>
      </div>
      
      <div 
        className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setLocation('/requests')}
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-amber-100 text-amber-600 mr-4">
            <MessageSquareIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-slate-700">Notificações</h3>
            <p className="text-sm text-slate-500 flex items-center">
              <span>Ver solicitações</span>
              <span className="ml-2 bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
            </p>
          </div>
        </div>
      </div>

      <NewScheduleModal isOpen={showNewScheduleModal} onClose={() => setShowNewScheduleModal(false)} />
    </div>
  );
}
