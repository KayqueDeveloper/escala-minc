import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Team } from "@shared/schema";
import { Plus, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import VolunteerForm from "@/components/volunteers/VolunteerForm";

export default function Volunteers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [showNewVolunteerDialog, setShowNewVolunteerDialog] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<User | null>(null);
  
  // Fetch volunteers
  const { data: volunteers, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Fetch teams
  const { data: teams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });
  
  // Filter volunteers based on search query and selected team
  const filteredVolunteers = volunteers?.filter(volunteer => {
    const matchesSearch = volunteer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         volunteer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // If no team is selected or we're not filtering by team, return true
    if (selectedTeam === "all") return matchesSearch;
    
    // Otherwise, filter by team membership
    // Note: In a real app, we'd need to fetch team memberships for each volunteer
    // For now, we'll assume this information is already included in the volunteer object
    // or we'd have to make additional queries to get this information
    return matchesSearch; // For now, ignore team filtering as we don't have that data readily available
  }) || [];
  
  const handleDeleteVolunteer = async (volunteer: User) => {
    if (confirm(`Deseja realmente excluir o voluntário "${volunteer.name}"?`)) {
      try {
        await apiRequest('DELETE', `/api/users/${volunteer.id}`);
        
        // Invalidate users query to refetch the data
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        
        toast({
          title: "Voluntário excluído",
          description: "O voluntário foi excluído com sucesso.",
        });
      } catch (error) {
        console.error("Error deleting volunteer:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o voluntário.",
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
          <Header title="Voluntários" subtitle="Gerenciamento de pessoas" />
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar voluntário por nome ou email..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="w-full md:w-48">
                    <Select
                      value={selectedTeam}
                      onValueChange={setSelectedTeam}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por time" />
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
                  
                  <Button
                    onClick={() => {
                      setEditingVolunteer(null);
                      setShowNewVolunteerDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Voluntário
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Voluntários ({filteredVolunteers.length})</CardTitle>
              <CardDescription>Lista de todas as pessoas cadastradas no sistema</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Times</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVolunteers.length > 0 ? (
                      filteredVolunteers.map((volunteer) => (
                        <TableRow key={volunteer.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold mr-3">
                                {volunteer.name.charAt(0)}
                              </div>
                              <span className="font-medium">{volunteer.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{volunteer.email}</TableCell>
                          <TableCell>{volunteer.phone}</TableCell>
                          <TableCell>
                            <div className="capitalize">
                              {volunteer.role === "admin" ? "Administrador" : 
                               volunteer.role === "leader" ? "Líder" : "Voluntário"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {/* In a real app, we'd show a list of teams the volunteer belongs to */}
                            {/* This is just a placeholder */}
                            <div className="flex gap-1">
                              <span className="inline-flex text-xs px-2 py-1 bg-slate-100 rounded-full">
                                Transmissão
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
                                    setEditingVolunteer(volunteer);
                                    setShowNewVolunteerDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  <span>Editar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteVolunteer(volunteer)}
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
                          {isLoading ? "Carregando voluntários..." : "Nenhum voluntário encontrado"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <Dialog 
            open={showNewVolunteerDialog} 
            onOpenChange={setShowNewVolunteerDialog}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVolunteer ? "Editar Voluntário" : "Novo Voluntário"}
                </DialogTitle>
              </DialogHeader>
              <VolunteerForm 
                volunteer={editingVolunteer || undefined}
                onSuccess={() => setShowNewVolunteerDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
