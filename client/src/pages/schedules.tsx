import React, { useState } from 'react';
import { BigCalendar, Event } from '@/components/ui/big-calendar';
import CalendarView from '@/components/schedules/calendar-view';
import ScheduleList from '@/components/schedules/schedule-list';
import ScheduleForm from '@/components/schedules/schedule-form';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Schedules: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("8"); // Default to August
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);

  // Fetch teams
  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['/api/teams'],
  });

  // Fetch schedules
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['/api/schedules'],
  });

  // Fetch events
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/events'],
  });

  // Convert schedules to calendar events
  const calendarEvents: Event[] = [];
  if (schedules && events) {
    schedules.forEach(schedule => {
      const event = events.find(e => e.id === schedule.eventId);
      if (event) {
        calendarEvents.push({
          id: schedule.id,
          title: event.name,
          start: new Date(event.date),
          end: new Date(event.endTime),
          color: schedule.status === 'published' ? '#4caf50' : '#ff9800'
        });
      }
    });
  }

  // Handle new schedule button click
  const handleNewSchedule = () => {
    setSelectedSchedule(null);
    setIsScheduleFormOpen(true);
  };

  // Handle edit schedule
  const handleEditSchedule = (schedule: any) => {
    setSelectedSchedule(schedule);
    setIsScheduleFormOpen(true);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-neutral-dark">Escalas</h1>
          <p className="text-neutral-medium">Gerencie as escalas dos seus times</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button 
            onClick={handleNewSchedule}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            <span className="material-icons mr-1 text-sm">add</span>
            Nova Escala
          </Button>
          <Button variant="outline">
            <span className="material-icons mr-1 text-sm">filter_list</span>
            Filtrar
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap gap-4">
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-neutral-dark mb-1">Time</label>
          <Select 
            value={selectedTeam} 
            onValueChange={setSelectedTeam}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Selecione um time" />
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
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-neutral-dark mb-1">Mês</label>
          <Select 
            value={selectedMonth} 
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Selecione um mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Julho 2023</SelectItem>
              <SelectItem value="8">Agosto 2023</SelectItem>
              <SelectItem value="9">Setembro 2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-auto">
          <label className="block text-sm font-medium text-neutral-dark mb-1">Status</label>
          <Select 
            value={selectedStatus} 
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Selecione um status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Month Calendar View */}
      <CalendarView visible={view === "calendar"} />

      {/* Schedule List View */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-neutral-light flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-dark">Próximas Escalas</h2>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-neutral-medium">Visualizar:</span>
            <div className="flex rounded overflow-hidden border border-neutral-light">
              <button 
                className={`px-3 py-1 text-sm ${view === 'list' ? 'bg-primary text-white' : 'bg-white text-neutral-dark'}`}
                onClick={() => setView('list')}
              >
                Lista
              </button>
              <button 
                className={`px-3 py-1 text-sm ${view === 'calendar' ? 'bg-primary text-white' : 'bg-white text-neutral-dark'}`}
                onClick={() => setView('calendar')}
              >
                Calendário
              </button>
            </div>
          </div>
        </div>
        
        {view === "list" && (
          <ScheduleList
            schedules={schedules || []}
            events={events || []}
            onEdit={handleEditSchedule}
          />
        )}
      </div>

      {/* Schedule Form Dialog */}
      <Dialog open={isScheduleFormOpen} onOpenChange={setIsScheduleFormOpen}>
        <DialogContent className="max-w-3xl">
          <ScheduleForm 
            schedule={selectedSchedule} 
            onClose={() => setIsScheduleFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedules;
