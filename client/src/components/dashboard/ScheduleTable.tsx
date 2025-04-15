import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Eye, Edit, Trash2, Send, Download } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Schedule, ScheduleDetail, User, Team, Role, Service } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ScheduleTableProps {
  date?: Date;
  teamId?: number;
  serviceId?: number;
}

export default function ScheduleTable({ date = new Date(), teamId, serviceId }: ScheduleTableProps) {
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<string>(teamId ? teamId.toString() : 'all');
  const [selectedService, setSelectedService] = useState<string>(serviceId ? serviceId.toString() : 'all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchValue, setSearchValue] = useState<string>('');
  
  // Format the date for display
  const formattedDate = format(date, "dd/MM", { locale: ptBR });
  
  // Get all teams
  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });
  
  // Get all services
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  // Get roles based on selected team
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/teams', selectedTeam !== 'all' ? parseInt(selectedTeam) : null, 'roles'],
    enabled: selectedTeam !== 'all',
  });
  
  // Get schedules for the selected date
  const { data: schedules, isLoading: schedulesLoading } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules', { 
      start: format(date, 'yyyy-MM-dd'),
      end: format(date, 'yyyy-MM-dd'),
      teamId: selectedTeam !== 'all' ? parseInt(selectedTeam) : undefined
    }],
  });
  
  // Get schedule details for all the schedules
  const { data: allScheduleDetails, isLoading: detailsLoading } = useQuery<ScheduleDetail[]>({
    queryKey: ['/api/schedule-details'],
    enabled: !!schedules && schedules.length > 0,
  });
  
  // Get all volunteers
  const { data: volunteers, isLoading: volunteersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Loading state
  const isLoading = teamsLoading || servicesLoading || rolesLoading || schedulesLoading || detailsLoading || volunteersLoading;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Filter schedules based on selected service
  const filteredSchedules = schedules?.filter(schedule => {
    if (selectedService === 'all') return true;
    return schedule.serviceId === parseInt(selectedService);
  }) || [];
  
  // Get schedule details for the filtered schedules
  const scheduleDetails = filteredSchedules.length > 0 && allScheduleDetails
    ? allScheduleDetails.filter(detail => 
        filteredSchedules.some(schedule => schedule.id === detail.scheduleId)
      )
    : [];
  
  // Filter schedule details based on selected role
  const filteredDetails = selectedRole === 'all'
    ? scheduleDetails
    : scheduleDetails.filter(detail => detail.roleId === parseInt(selectedRole));
  
  // Filter by search term (volunteer name)
  const searchFilteredDetails = searchValue
    ? filteredDetails.filter(detail => {
        const volunteer = volunteers?.find(v => v.id === detail.volunteerId);
        return volunteer?.name.toLowerCase().includes(searchValue.toLowerCase());
      })
    : filteredDetails;
  
  // Function to get volunteer name
  const getVolunteerName = (volunteerId?: number) => {
    if (!volunteerId) return 'Não atribuído';
    const volunteer = volunteers?.find(v => v.id === volunteerId);
    return volunteer?.name || 'Desconhecido';
  };
  
  // Function to get role name
  const getRoleName = (roleId?: number) => {
    if (!roleId) return 'Desconhecido';
    const role = roles?.find(r => r.id === roleId);
    if (!role) {
      // Try to find the role in all teams
      const allRoles = teams?.flatMap(team => 
        useQuery<Role[]>({
          queryKey: ['/api/teams', team.id, 'roles'],
          enabled: !!team.id,
        }).data || []
      );
      return allRoles?.find(r => r.id === roleId)?.name || 'Função';
    }
    return role.name;
  };
  
  // Function to get volunteer status
  const getVolunteerStatus = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Confirmado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pendente
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Indisponível
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            Pendente
          </span>
        );
    }
  };
  
  // Function to handle removing a volunteer from schedule
  const handleRemoveVolunteer = async (detailId: number) => {
    try {
      await apiRequest('DELETE', `/api/schedule-details/${detailId}`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-details'] });
      
      toast({
        title: "Voluntário removido",
        description: "O voluntário foi removido da escala com sucesso",
      });
    } catch (error) {
      console.error('Error removing volunteer:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o voluntário da escala",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800">Próximo Domingo - {formattedDate}</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center">
            <Send className="h-4 w-4 mr-1" />
            <span>Enviar Escalas</span>
          </Button>
          <Button variant="outline" className="flex items-center">
            <Download className="h-4 w-4 mr-1" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="filterTeam" className="block text-sm font-medium text-slate-700 mb-1">Time</label>
              <Select 
                value={selectedTeam} 
                onValueChange={setSelectedTeam}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {teams?.map(team => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="filterService" className="block text-sm font-medium text-slate-700 mb-1">Culto</label>
              <Select 
                value={selectedService} 
                onValueChange={setSelectedService}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um culto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {services?.map(service => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="filterRole" className="block text-sm font-medium text-slate-700 mb-1">Função</label>
              <Select 
                value={selectedRole} 
                onValueChange={setSelectedRole}
                disabled={selectedTeam === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {roles?.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="searchVolunteer" className="block text-sm font-medium text-slate-700 mb-1">Buscar Voluntário</label>
              <Input 
                id="searchVolunteer" 
                placeholder="Nome do voluntário..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Função</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Em Treinamento</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchFilteredDetails.length > 0 ? (
                searchFilteredDetails.map((detail) => {
                  const volunteer = volunteers?.find(v => v.id === detail.volunteerId);
                  return (
                    <TableRow key={detail.id} className="hover:bg-slate-50">
                      <TableCell className="text-sm">{getRoleName(detail.roleId)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold mr-3">
                            {volunteer?.name.charAt(0) || '?'}
                          </div>
                          <span>{getVolunteerName(detail.volunteerId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getVolunteerStatus(detail.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {detail.traineeId ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{volunteer?.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" title="Ver perfil">
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Editar">
                            <Edit className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Remover"
                            onClick={() => handleRemoveVolunteer(detail.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Nenhum voluntário encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {searchFilteredDetails.length > 0 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Mostrando {searchFilteredDetails.length} de {filteredDetails.length} voluntários
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <Button size="sm">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">Próximo</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
