import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Team, User } from "@shared/schema";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TeamForm from "@/components/teams/TeamForm";

export default function Teams() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  
  // Fetch teams
  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });
  
  // Fetch users to get team leaders
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Filter teams based on search query
  const filteredTeams = teams?.filter(team => {
    return team.name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];
  
  // Helper function to get leader name
  const getLeaderName = (leaderId?: number) => {
    if (!leaderId) return "-";
    const leader = users?.find(user => user.id === leaderId);
    return leader?.name || "-";
  };
  
  const handleDeleteTeam = async (team: Team) => {
    if (confirm(`Deseja realmente excluir o time "${team.name}"?`)) {
      try {
        await apiRequest('DELETE', `/api/teams/${team.id}`);
        
        // Invalidate teams query to refetch the data
        queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
        
        toast({
          title: "Time excluído",
          description: "O time foi excluído com sucesso.",
        });
      } catch (error) {
        console.error("Error deleting team:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o time.",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Header title="Times" subtitle="Gerenciamento de equipes e ministérios" />
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar time por nome..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={() => {
                    setEditingTeam(null);
                    setShowNewTeamDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Time
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Times ({filteredTeams.length})</CardTitle>
              <CardDescription>Lista de todas as equipes e ministérios cadastrados</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Líder</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead>Funções</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.length > 0 ? (
                      filteredTeams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {team.description || "-"}
                          </TableCell>
                          <TableCell>{getLeaderName(team.leaderId)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1 text-slate-400" />
                              <span>
                                {/* In a real app, we'd fetch and display the actual member count */}
                                {Math.floor(Math.random() * 20) + 1} membros
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {/* In a real app, we'd fetch and display the actual roles */}
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">
                                Coordenador
                              </span>
                              <span className="text-xs px-2 py-1 bg-slate-100 rounded-full">
                                Operador
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingTeam(team);
                                    setShowNewTeamDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  <span>Editar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteTeam(team)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span>Excluir</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                          {isLoading ? "Carregando times..." : "Nenhum time encontrado"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <Dialog 
            open={showNewTeamDialog} 
            onOpenChange={setShowNewTeamDialog}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTeam ? "Editar Time" : "Novo Time"}
                </DialogTitle>
              </DialogHeader>
              <TeamForm 
                team={editingTeam || undefined}
                onSuccess={() => setShowNewTeamDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
