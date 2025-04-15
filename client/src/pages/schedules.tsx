import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, List, Grid, Plus, Filter } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Calendar from "@/components/dashboard/Calendar";
import ScheduleTable from "@/components/dashboard/ScheduleTable";
import { Button } from "@/components/ui/button";
import { NewScheduleModal } from "@/components/modals/NewScheduleModal";
import { Team, Service } from "@shared/schema";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

enum ViewMode {
  Calendar = "calendar",
  List = "list",
}

export default function Schedules() {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Calendar);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);

  // Get teams
  const { data: teams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });
  
  // Get services
  const { data: services } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Header title="Escalas" subtitle="Gerenciamento de escalações" />
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === ViewMode.Calendar ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(ViewMode.Calendar)}
                >
                  <Grid className="h-4 w-4 mr-1" />
                  Calendário
                </Button>
                <Button
                  variant={viewMode === ViewMode.List ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(ViewMode.List)}
                >
                  <List className="h-4 w-4 mr-1" />
                  Lista
                </Button>
              </div>
              
              <div className="flex items-center flex-1 justify-end gap-2">
                <div className="w-full md:w-40">
                  <Select
                    value={selectedTeam}
                    onValueChange={setSelectedTeam}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os times</SelectItem>
                      {teams?.map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-36">
                  <Select
                    value={selectedService}
                    onValueChange={setSelectedService}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Culto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cultos</SelectItem>
                      {services?.map(service => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full md:w-40">
                  <Select
                    value={format(selectedMonth, "yyyy-MM")}
                    onValueChange={(value) => {
                      const [year, month] = value.split("-").map(Number);
                      setSelectedMonth(new Date(year, month - 1));
                    }}
                  >
                    <SelectTrigger>
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() - 6 + i);
                        return (
                          <SelectItem 
                            key={i} 
                            value={format(date, "yyyy-MM")}
                          >
                            {format(date, "MMMM yyyy", { locale: ptBR })}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={() => setShowNewScheduleModal(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Escala
                </Button>
              </div>
            </div>
          </div>
          
          {viewMode === ViewMode.Calendar ? (
            <Calendar />
          ) : (
            <ScheduleTable 
              date={selectedMonth}
              teamId={selectedTeam !== "all" ? parseInt(selectedTeam) : undefined}
              serviceId={selectedService !== "all" ? parseInt(selectedService) : undefined}
            />
          )}
          
          <NewScheduleModal
            isOpen={showNewScheduleModal}
            onClose={() => setShowNewScheduleModal(false)}
          />
        </div>
      </main>
    </div>
  );
}
