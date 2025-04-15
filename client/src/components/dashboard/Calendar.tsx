import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Service, Schedule, Event } from '@shared/schema';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NewScheduleModal } from '@/components/modals/NewScheduleModal';

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  
  // Fetch services
  const { data: services } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  // Fetch schedules for the current month view
  const { data: schedules } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules', { 
      start: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      end: format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    }],
  });

  // Fetch events for the current month view
  const { data: events } = useQuery<Event[]>({
    queryKey: ['/api/events', { 
      start: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      end: format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    }],
  });

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };

  const renderHeader = () => {
    const dateFormat = "MMMM yyyy";
    return (
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Próximas Escalas</h2>
        <div className="flex items-center space-x-2">
          <Button 
            className="flex items-center"
            onClick={() => setShowNewScheduleModal(true)}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            <span>Nova Escala</span>
          </Button>
          <div className="relative flex items-center">
            <Button variant="outline" onClick={prevMonth} className="mr-2">
              &lt;
            </Button>
            <span className="text-lg font-medium">
              {format(currentMonth, dateFormat, { locale: ptBR })}
            </span>
            <Button variant="outline" onClick={nextMonth} className="ml-2">
              &gt;
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 text-center border-b">
        {weekDays.map((day, index) => (
          <div key={index} className="py-3 font-medium text-slate-600">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];

    let days = eachDayOfInterval({ start: startDate, end: endDate });
    let formattedDates = days.map(day => format(day, 'yyyy-MM-dd'));

    let day = startDate;
    let daysInMonth = [];

    // Group days into weeks
    while (day <= endDate) {
      let week = [];
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(cloneDay, 'yyyy-MM-dd');
        
        // Find schedules for this day
        const daySchedules = schedules?.filter(
          schedule => format(new Date(schedule.date), 'yyyy-MM-dd') === formattedDate
        ) || [];

        // Find events for this day
        const dayEvents = events?.filter(
          event => format(new Date(event.date), 'yyyy-MM-dd') === formattedDate
        ) || [];

        week.push(
          <div
            key={day.toString()}
            className={`bg-white p-1 min-h-[100px] ${
              !isSameMonth(day, monthStart) ? "text-slate-400" : ""
            }`}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className={`text-right text-sm mb-1 ${
              isToday(day) 
                ? "font-bold text-primary" 
                : isSameMonth(day, monthStart) 
                  ? "text-slate-600" 
                  : "text-slate-400"
            }`}>
              {format(day, dateFormat)}
            </div>
            
            {/* Show schedules and events for this day */}
            {daySchedules.map((schedule, idx) => {
              const service = services?.find(s => s.id === schedule.serviceId);
              return service ? (
                <div 
                  key={`schedule-${schedule.id}`} 
                  className="text-xs font-medium text-white bg-primary rounded p-1 mb-1"
                >
                  Culto {service.time}
                </div>
              ) : null;
            })}
            
            {dayEvents.map((event) => (
              <div 
                key={`event-${event.id}`} 
                className="text-xs font-medium text-white bg-purple-500 rounded p-1"
              >
                {event.name}
              </div>
            ))}
          </div>
        );
        day = new Date(day.getTime() + 24 * 60 * 60 * 1000); // Add a day
      }
      rows.push(
        <div className="grid grid-cols-7 gap-px" key={`week-${day}`}>
          {week}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-100 p-px">
        {rows.flat()}
      </div>
    );
  };

  return (
    <div className="mb-8">
      {renderHeader()}
      
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100">
        {renderDays()}
        <div className="grid grid-cols-7 gap-px bg-slate-100 p-px">
          {renderCells()}
        </div>
      </div>

      <NewScheduleModal isOpen={showNewScheduleModal} onClose={() => setShowNewScheduleModal(false)} />
    </div>
  );
}
