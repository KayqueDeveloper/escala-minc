import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Calendar, 
  Edit,
  ListFilter,
  CalendarDays,
  CalendarClock
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
import { formatDate } from "@/lib/utils/date-utils";
import { EventForm } from "@/components/events/event-form";

export default function Events() {
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/events', filterType],
  });
  
  // Apply search filter
  const filteredEvents = events?.filter(event => {
    return (
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(event.eventDate, 'dd/MM/yyyy').includes(searchTerm) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });
  
  // Get event type label
  const getEventTypeLabel = (eventType: string) => {
    const types: Record<string, string> = {
      regular_service: 'Culto Regular',
      special_event: 'Evento Especial',
      conference: 'Conferência'
    };
    return types[eventType] || eventType;
  };
  
  // Format event time
  const formatEventTime = (date: string) => {
    return formatDate(date, 'HH:mm');
  };
  
  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50 font-sans">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900 font-heading">Eventos</h1>
                <Button onClick={() => setEventFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Evento
                </Button>
              </div>
              
              <div className="mt-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="w-full md:w-72 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar eventos..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2 items-center">
                  <ListFilter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Eventos</SelectItem>
                      <SelectItem value="regular_service">Cultos</SelectItem>
                      <SelectItem value="special_event">Eventos Especiais</SelectItem>
                      <SelectItem value="upcoming">Próximos</SelectItem>
                      <SelectItem value="past">Passados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Eventos e Cultos</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-10 text-center">
                      <p className="text-gray-500">Carregando eventos...</p>
                    </div>
                  ) : filteredEvents?.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-gray-500">Nenhum evento encontrado</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data/Horário</TableHead>
                            <TableHead>Evento</TableHead>
                            <TableHead>Local</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEvents?.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {formatDate(event.eventDate, 'dd/MM/yyyy')}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatEventTime(event.eventDate)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{event.title}</div>
                                {event.description && (
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {event.description}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{event.location}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {getEventTypeLabel(event.eventType)}
                                </Badge>
                                {event.recurrent && (
                                  <Badge variant="outline" className="ml-1 bg-purple-50 text-purple-700 border-purple-200">
                                    <CalendarClock className="h-3 w-3 mr-1" />
                                    Recorrente
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {new Date(event.eventDate) > new Date() ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Próximo
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                    Passado
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => window.location.href = `/schedules?eventId=${event.id}`}
                                  >
                                    <CalendarDays className="h-4 w-4 mr-1" />
                                    Ver Escala
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4 mr-1" />
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
      <EventForm open={eventFormOpen} onOpenChange={setEventFormOpen} />
    </div>
  );
}
