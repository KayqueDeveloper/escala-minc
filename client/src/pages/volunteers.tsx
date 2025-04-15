import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Mail, 
  RefreshCw,
  ListFilter, 
  AlertTriangle
} from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VolunteerForm } from "@/components/volunteers/volunteer-form";

export default function Volunteers() {
  const [volunteerFormOpen, setVolunteerFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  
  const { data: volunteers, isLoading } = useQuery({
    queryKey: ['/api/volunteers'],
  });
  
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
  });
  
  // Apply search and team filters
  const filteredVolunteers = volunteers?.filter(volunteer => {
    const matchesSearch = 
      volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTeam = 
      filterTeam === "all" || 
      volunteer.teams.some(team => team.id.toString() === filterTeam);
      
    return matchesSearch && matchesTeam;
  });
  
  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50 font-sans">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 font-heading">Voluntários</h1>
                <Button onClick={() => setVolunteerFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Voluntário
                </Button>
              </div>
              
              <div className="mt-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="w-full md:w-72 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar voluntários..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2 items-center">
                  <ListFilter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Time:</span>
                  <Select value={filterTeam} onValueChange={setFilterTeam}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Times</SelectItem>
                      {teams?.map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Voluntários</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-10 text-center">
                      <p className="text-gray-500">Carregando voluntários...</p>
                    </div>
                  ) : filteredVolunteers?.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-gray-500">Nenhum voluntário encontrado</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Voluntário</TableHead>
                            <TableHead>Times</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredVolunteers?.map((volunteer) => (
                            <TableRow key={volunteer.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar>
                                    <AvatarImage src={volunteer.avatarUrl} alt={volunteer.name} />
                                    <AvatarFallback>
                                      {volunteer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{volunteer.name}</div>
                                    <div className="text-sm text-gray-500">{volunteer.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {volunteer.teams.map(team => (
                                    <Badge key={team.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      {team.name} ({team.role})
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                {volunteer.hasConflicts ? (
                                  <Badge variant="destructive">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Conflito
                                  </Badge>
                                ) : volunteer.isTrainee ? (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    Em treinamento
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Ativo
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Mail className="h-4 w-4 mr-1" />
                                    Contatar
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <RefreshCw className="h-4 w-4 mr-1" />
                                    Editar
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      <VolunteerForm open={volunteerFormOpen} onOpenChange={setVolunteerFormOpen} />
    </div>
  );
}
