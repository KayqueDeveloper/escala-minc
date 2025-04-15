import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { 
  CalendarDays, 
  ListFilter, 
  Plus, 
  AlertTriangle,
  Search 
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
import { AvatarGroup } from "@/components/ui/avatar-group";
import { formatDate } from "@/lib/utils/date-utils";
import { ScheduleForm } from "@/components/schedules/schedule-form";

export default function Schedules() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  
  // Get 'filter' query parameter
  const params = new URLSearchParams(search);
  const filterParam = params.get('filter');
  
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState(filterParam || "all");
  
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['/api/schedules', filterType],
  });
  
  // Apply search filter
  const filteredSchedules = schedules?.filter(schedule => {
    return (
      schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(schedule.eventDate, 'dd/MM/yyyy').includes(searchTerm)
    );
  });
  
  const handleFilterChange = (value: string) => {
    setFilterType(value);
    
    // Update URL
    const newParams = new URLSearchParams(search);
    if (value === "all") {
      newParams.delete('filter');
    } else {
      newParams.set('filter', value);
    }
    
    const newSearch = newParams.toString();
    setLocation(`/schedules${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };
  
  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50 font-sans">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 font-heading">Escalas</h1>
                <Button onClick={() => setScheduleFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Escala
                </Button>
              </div>
              
              <div className="mt-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="w-full md:w-72 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar escalas..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2 items-center">
                  <ListFilter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Filtrar:</span>
                  <Select value={filterType} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Escalas</SelectItem>
                      <SelectItem value="upcoming">Próximas</SelectItem>
                      <SelectItem value="incomplete">Incompletas</SelectItem>
                      <SelectItem value="conflicts">Com Conflitos</SelectItem>
                      <SelectItem value="past">Passadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Escalas</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-10 text-center">
                      <p className="text-gray-500">Carregando escalas...</p>
                    </div>
                  ) : filteredSchedules?.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-gray-500">Nenhuma escala encontrada</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data/Horário</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Local</TableHead>
                            <TableHead>Voluntários</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSchedules?.map((schedule) => (
                            <TableRow key={schedule.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {formatDate(schedule.eventDate, 'dd/MM/yyyy')}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(schedule.eventDate, 'HH:mm')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{schedule.title}</div>
                                <div className="text-xs text-gray-500">
                                  {schedule.teamCount} times envolvidos
                                </div>
                              </TableCell>
                              <TableCell>{schedule.location}</TableCell>
                              <TableCell>
                                <AvatarGroup 
                                  avatars={schedule.volunteers.map(v => ({
                                    src: v.avatarUrl,
                                    alt: v.name,
                                    fallback: v.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                                  }))}
                                  max={3}
                                  size="sm"
                                />
                              </TableCell>
                              <TableCell>
                                {schedule.hasConflicts && (
                                  <Badge variant="destructive" className="mr-1">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Conflito
                                  </Badge>
                                )}
                                
                                {schedule.status === 'complete' ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Completa
                                  </Badge>
                                ) : schedule.status === 'warning' ? (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    Atenção
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    Incompleta
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.location.href = `/schedules/${schedule.id}`}
                                >
                                  <CalendarDays className="h-4 w-4 mr-1" />
                                  Ver escala
                                </Button>
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
      <ScheduleForm open={scheduleFormOpen} onOpenChange={setScheduleFormOpen} />
    </div>
  );
}
