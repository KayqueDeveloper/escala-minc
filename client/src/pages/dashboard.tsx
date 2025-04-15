import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';

const Dashboard: React.FC = () => {
  // Fetch summary data
  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['/api/teams'],
    staleTime: 60000, // 1 minute
  });

  const { data: schedules, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['/api/schedules'],
    staleTime: 60000,
  });

  const { data: swapRequests, isLoading: isLoadingSwapRequests } = useQuery({
    queryKey: ['/api/swap-requests?status=pending'],
    staleTime: 60000,
  });

  // Calculate summary stats
  const stats = [
    { 
      label: 'Times', 
      value: teams?.length || 0, 
      icon: 'groups',
      color: 'bg-primary text-white'
    },
    { 
      label: 'Escalas Ativas', 
      value: schedules?.filter(s => s.status === 'published')?.length || 0, 
      icon: 'event',
      color: 'bg-green-600 text-white'
    },
    { 
      label: 'Solicitações de Troca', 
      value: swapRequests?.length || 0, 
      icon: 'swap_horiz',
      color: 'bg-secondary text-white'
    },
    { 
      label: 'Conflitos Detectados', 
      value: 2, // Sample data, would be calculated from assignments in real app
      icon: 'warning',
      color: 'bg-red-600 text-white'
    },
  ];

  // Sample upcoming events
  const upcomingEvents = [
    {
      id: 1,
      name: 'Culto da Manhã',
      date: '27/08/2023',
      time: '9h',
      teams: ['Equipe de Transmissão', 'Recepção'],
      volunteers: 12
    },
    {
      id: 2,
      name: 'Culto da Manhã',
      date: '27/08/2023',
      time: '11h',
      teams: ['Equipe de Transmissão', 'Recepção'],
      volunteers: 12
    },
    {
      id: 3,
      name: 'Culto da Noite',
      date: '27/08/2023',
      time: '18h',
      teams: ['Equipe de Transmissão', 'Recepção'],
      volunteers: 10
    },
  ];

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-neutral-800">Dashboard</h1>
          <p className="text-neutral-500">Visão geral do sistema de escalas</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className={`p-6 ${stat.color} rounded-lg`}>
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <p className="text-lg font-medium">{stat.label}</p>
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
                </div>
                <div className="rounded-full p-3 bg-white bg-opacity-20">
                  <span className="material-icons text-2xl">{stat.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Events */}
      <Card className="mb-6">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-800">Próximos Eventos</h2>
          <a href="/schedules" className="text-primary hover:text-primary-dark text-sm font-medium">
            Ver todos
          </a>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-100">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="p-4 hover:bg-neutral-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-neutral-800">{event.name}</h3>
                    <p className="text-sm text-neutral-500">
                      {event.date} • {event.time}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-1 text-neutral-500">groups</span>
                      <span className="text-sm text-neutral-700">{event.teams.join(', ')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="material-icons text-sm mr-1 text-neutral-500">person</span>
                      <span className="text-sm text-neutral-700">{event.volunteers} voluntários</span>
                    </div>
                    <button className="mt-2 md:mt-0 bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary-dark transition-colors">
                      Ver Escala
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions Card */}
      <Card>
        <div className="p-4 border-b border-neutral-100">
          <h2 className="text-lg font-medium text-neutral-800">Ações Rápidas</h2>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
              <span className="material-icons mr-2">add</span>
              Nova Escala
            </button>
            <button className="flex items-center justify-center p-4 bg-white border border-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-50 transition-colors">
              <span className="material-icons mr-2">person_add</span>
              Adicionar Voluntário
            </button>
            <button className="flex items-center justify-center p-4 bg-white border border-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-50 transition-colors">
              <span className="material-icons mr-2">swap_horiz</span>
              Solicitar Troca
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
