import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import TeamForm from '@/components/teams/team-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';

const Teams: React.FC = () => {
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);

  // Fetch teams data
  const { data: teams, isLoading } = useQuery({
    queryKey: ['/api/teams'],
  });

  // Handle new team button click
  const handleNewTeam = () => {
    setSelectedTeam(null);
    setIsTeamFormOpen(true);
  };

  // Handle edit team
  const handleEditTeam = (team: any) => {
    setSelectedTeam(team);
    setIsTeamFormOpen(true);
  };
  
  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-neutral-dark">Times</h1>
          <p className="text-neutral-medium">Gerencie os times de ministério e suas funções</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={handleNewTeam}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            <span className="material-icons mr-1 text-sm">add</span>
            Novo Time
          </Button>
        </div>
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="bg-neutral-100 h-24"></CardHeader>
              <CardContent className="p-4">
                <div className="h-6 bg-neutral-100 rounded mb-2"></div>
                <div className="h-4 bg-neutral-100 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams?.map((team: any) => (
            <Card key={team.id} className="overflow-hidden">
              <div 
                className="h-20 flex items-center justify-center"
                style={{ backgroundColor: team.color || '#3f51b5' }}
              >
                <span className="material-icons text-white text-4xl">groups</span>
              </div>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium text-neutral-dark mb-1">{team.name}</h3>
                <p className="text-sm text-neutral-medium mb-3">{team.description || 'Sem descrição'}</p>
                
                <div className="flex justify-between mt-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span className="material-icons text-xs">person</span>
                    <span>12 voluntários</span>
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditTeam(team)}
                  >
                    <span className="material-icons text-primary text-base">edit</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Team Form Dialog */}
      <Dialog open={isTeamFormOpen} onOpenChange={setIsTeamFormOpen}>
        <DialogContent className="max-w-2xl">
          <TeamForm 
            team={selectedTeam} 
            onClose={() => setIsTeamFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teams;
