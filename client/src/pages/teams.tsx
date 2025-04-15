import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Users, 
  PlusCircle, 
  Edit,
  ListFilter 
} from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TeamForm } from "@/components/teams/team-form";
import { RoleForm } from "@/components/teams/role-form";

export default function Teams() {
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: teams, isLoading } = useQuery({
    queryKey: ['/api/teams/with-roles'],
  });
  
  // Apply search filter
  const filteredTeams = teams?.filter(team => {
    return (
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.leader?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.roles.some(role => role.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  const openRoleForm = (teamId: number) => {
    setCurrentTeamId(teamId);
    setRoleFormOpen(true);
  };
  
  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50 font-sans">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 font-heading">Times</h1>
                <Button onClick={() => setTeamFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Time
                </Button>
              </div>
              
              <div className="mt-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="w-full md:w-72 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar times..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {isLoading ? (
                <div className="py-10 text-center">
                  <p className="text-gray-500">Carregando times...</p>
                </div>
              ) : filteredTeams?.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-gray-500">Nenhum time encontrado</p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTeams?.map((team) => (
                    <Card key={team.id} className="overflow-hidden">
                      <CardHeader className="bg-primary-50 pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-semibold text-primary-700">{team.name}</CardTitle>
                          <Button variant="ghost" size="sm" onClick={() => {/* Open edit team dialog */}}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                        {team.leader && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={team.leader.avatarUrl} alt={team.leader.name} />
                              <AvatarFallback>
                                {team.leader.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-600">
                              Líder: {team.leader.name}
                            </span>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-4">
                        {team.description && (
                          <p className="text-sm text-gray-600 mb-4">{team.description}</p>
                        )}
                        
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-sm font-medium text-gray-900">Funções</h3>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-xs"
                            onClick={() => openRoleForm(team.id)}
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" />
                            Adicionar Função
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {team.roles.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">Nenhuma função definida</p>
                          ) : (
                            team.roles.map((role, index) => (
                              <div key={role.id} className="flex justify-between py-1">
                                <span className="text-sm">{role.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {role.volunteerCount || 0} voluntários
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {team.volunteerCount || 0} voluntários
                            </span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.location.href = `/teams/${team.id}`}
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <TeamForm open={teamFormOpen} onOpenChange={setTeamFormOpen} />
      <RoleForm 
        open={roleFormOpen} 
        onOpenChange={setRoleFormOpen}
        teamId={currentTeamId}
      />
    </div>
  );
}
