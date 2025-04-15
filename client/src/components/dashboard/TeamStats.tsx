import { useQuery } from '@tanstack/react-query';
import { Team, Role, TeamMember } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function TeamStats() {
  const { user } = useAuth();

  // Get teams for the current user (assuming they are a leader)
  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  // Get the first team (we'll show stats for just one team in this component)
  const team = teams?.[0];

  // Get team members for this team
  const { data: teamMembers, isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ['/api/teams', team?.id, 'members'],
    enabled: !!team?.id,
  });

  // Get roles for this team
  const { data: roles, isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ['/api/teams', team?.id, 'roles'],
    enabled: !!team?.id,
  });

  const isLoading = teamsLoading || membersLoading || rolesLoading;

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Estatísticas da Equipe</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!team || !roles || !teamMembers) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Estatísticas da Equipe</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <p className="text-slate-500">Nenhuma equipe encontrada.</p>
        </div>
      </div>
    );
  }

  // Group members by role
  const membersByRole = roles.map(role => {
    const roleMembers = teamMembers.filter(member => member.roleId === role.id);
    return {
      role,
      members: roleMembers,
      count: roleMembers.length
    };
  });

  // Generate random percentage values for the role progress bars
  const getPercentage = (count: number) => {
    // This is just for visual effect in the demo - in a real app, 
    // we might calculate the actual percentage of roles filled vs needed
    return Math.min(count * 15 + 30, 95);
  };

  // Get role colors
  const getRoleColor = (index: number) => {
    const colors = [
      'bg-primary',
      'bg-green-500',
      'bg-indigo-500',
      'bg-amber-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-pink-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Estatísticas da Equipe</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{team.name}</h3>
            <a href="/teams" className="text-sm text-primary hover:text-primary-dark">Ver detalhes</a>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">Total de Voluntários</p>
            <p className="font-semibold">{teamMembers.length}</p>
          </div>
          
          {membersByRole.map((item, index) => (
            <div key={item.role.id} className="mb-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-slate-600">{item.role.name}</p>
                <p className="text-sm font-medium">{item.count}</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className={`${getRoleColor(index)} h-2 rounded-full`} 
                  style={{ width: `${getPercentage(item.count)}%` }}
                ></div>
              </div>
            </div>
          ))}
          
          <div className="flex justify-center mt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/teams'}
            >
              Gerenciar Funções
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
