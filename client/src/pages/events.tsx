import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { format, parse, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Plus, 
  Search, 
  CalendarDays, 
  Clock, 
  MapPin, 
  Edit, 
  Trash2 
} from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEventSchema } from "@shared/schema";

// Extend the insert schema for the form validation
const eventFormSchema = insertEventSchema;

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function Events() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch events
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  // Initialize form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      date: new Date(),
      startTime: "",
      endTime: "",
      description: "",
    },
  });

  // Reset the form when editing event changes
  const openEventDialog = (event?: Event) => {
    if (event) {
      form.reset({
        name: event.name,
        date: new Date(event.date),
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description || "",
      });
      setEditingEvent(event);
    } else {
      form.reset({
        name: "",
        date: new Date(),
        startTime: "",
        endTime: "",
        description: "",
      });
      setEditingEvent(null);
    }
    setShowEventDialog(true);
  };

  // Filter events based on search query
  const filteredEvents = events?.filter(event => {
    return event.name.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  // Sort events by date (nearest first)
  const sortedEvents = [...(filteredEvents || [])].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Group events by month
  const eventsByMonth: Record<string, Event[]> = {};
  sortedEvents.forEach(event => {
    const monthYear = format(new Date(event.date), 'MMMM yyyy', { locale: ptBR });
    if (!eventsByMonth[monthYear]) {
      eventsByMonth[monthYear] = [];
    }
    eventsByMonth[monthYear].push(event);
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      setIsSubmitting(true);

      if (editingEvent) {
        // Update existing event
        await apiRequest('PUT', `/api/events/${editingEvent.id}`, data);
      } else {
        // Create new event
        await apiRequest('POST', '/api/events', data);
      }

      // Invalidate events query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });

      toast({
        title: editingEvent ? "Evento atualizado" : "Evento criado",
        description: editingEvent 
          ? "O evento foi atualizado com sucesso"
          : "O novo evento foi criado com sucesso",
      });

      setShowEventDialog(false);
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o evento",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    if (confirm(`Deseja realmente excluir o evento "${event.name}"?`)) {
      try {
        await apiRequest('DELETE', `/api/events/${event.id}`);
        
        // Invalidate events query to refetch the data
        queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        
        toast({
          title: "Evento excluído",
          description: "O evento foi excluído com sucesso.",
        });
      } catch (error) {
        console.error("Error deleting event:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o evento.",
          variant: "destructive",
        });
      }
    }
  };

  // Helper function to determine if an event is in the past
  const isEventInPast = (date: string) => {
    return isBefore(new Date(date), new Date());
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Header title="Eventos" subtitle="Gestão de eventos especiais" />
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar evento por nome..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={() => openEventDialog()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Evento
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {Object.keys(eventsByMonth).length > 0 ? (
            Object.entries(eventsByMonth).map(([month, monthEvents]) => (
              <Card key={month} className="mb-6">
                <CardHeader>
                  <CardTitle className="capitalize">{month}</CardTitle>
                  <CardDescription>{monthEvents.length} evento(s) programado(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthEvents.map((event) => (
                      <div 
                        key={event.id} 
                        className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between
                                    ${isEventInPast(event.date) ? 'bg-slate-50 opacity-70' : 'bg-white'}`}
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{event.name}</h3>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center text-sm text-slate-600">
                              <CalendarDays className="h-4 w-4 mr-2" />
                              <span>{format(new Date(event.date), 'dd MMMM yyyy, EEEE', { locale: ptBR })}</span>
                            </div>
                            <div className="flex items-center text-sm text-slate-600">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>{event.startTime} às {event.endTime}</span>
                            </div>
                            {event.description && (
                              <p className="text-sm text-slate-600 mt-2">{event.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center">
                          {isEventInPast(event.date) && (
                            <div className="mr-4 px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded">
                              Realizado
                            </div>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEventDialog(event)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteEvent(event)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                <span>Excluir</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CalendarDays className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium">Nenhum evento encontrado</h3>
                <p className="text-slate-500 mt-2">
                  {isLoading ? "Carregando eventos..." : "Não há eventos cadastrados ou correspondentes à busca."}
                </p>
                {!isLoading && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => openEventDialog()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Evento
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          
          <Dialog 
            open={showEventDialog} 
            onOpenChange={setShowEventDialog}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Editar Evento" : "Novo Evento"}
                </DialogTitle>
                <DialogDescription>
                  {editingEvent 
                    ? "Atualize as informações do evento" 
                    : "Adicione um novo evento ao calendário"}
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Evento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Conferência, Retiro, Culto Especial" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value instanceof Date ? format(field.value, 'yyyy-MM-dd') : ''} 
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Início</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 19:00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Término</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 21:00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição (opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva detalhes sobre o evento"
                            className="resize-none"
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Salvando..." : editingEvent ? "Atualizar Evento" : "Criar Evento"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
