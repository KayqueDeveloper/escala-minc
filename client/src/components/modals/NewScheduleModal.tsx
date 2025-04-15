import { useState } from "react";
import { Calendar, Clock, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Team, Service, Role, InsertSchedule } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewScheduleModal({ isOpen, onClose }: NewScheduleModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [type, setType] = useState<string>("service");
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState<string>("11h");
  const [teamId, setTeamId] = useState<string>("");
  const [roles, setRoles] = useState<{ id: number; name: string; count: number; selected: boolean }[]>([]);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [considerAvailability, setConsiderAvailability] = useState<boolean>(true);
  const [autoAssign, setAutoAssign] = useState<boolean>(false);
  
  // Get teams
  const { data: teams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });
  
  // Get services
  const { data: services } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  // Get roles for selected team
  const { data: teamRoles } = useQuery<Role[]>({
    queryKey: ['/api/teams', teamId ? parseInt(teamId) : null, 'roles'],
    enabled: !!teamId,
    onSuccess: (data) => {
      // Initialize roles with counts
      const initialRoles = data.map(role => ({
        id: role.id,
        name: role.name,
        count: 1,
        selected: true
      }));
      setRoles(initialRoles);
    }
  });
  
  const handleRoleSelectionChange = (roleId: number, checked: boolean) => {
    setRoles(prev => 
      prev.map(role => 
        role.id === roleId 
          ? { ...role, selected: checked } 
          : role
      )
    );
  };
  
  const handleRoleCountChange = (roleId: number, count: number) => {
    setRoles(prev => 
      prev.map(role => 
        role.id === roleId 
          ? { ...role, count: Math.max(1, count) } 
          : role
      )
    );
  };
  
  const handleSubmit = async () => {
    if (!teamId || !date) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Find the selected service
      const selectedService = services?.find(s => s.time === time);
      
      // Create the schedule
      const scheduleData: Partial<InsertSchedule> = {
        teamId: parseInt(teamId),
        date: new Date(date),
        serviceId: type === "service" ? selectedService?.id : undefined,
        eventId: type === "event" ? null : undefined, // Would be set for events
        status: "draft",
        createdBy: user?.id
      };
      
      const response = await apiRequest('POST', '/api/schedules', scheduleData);
      const newSchedule = await response.json();
      
      // For each selected role, create schedule details
      const selectedRoles = roles.filter(r => r.selected);
      
      for (const role of selectedRoles) {
        // Create as many slots as specified in the count
        for (let i = 0; i < role.count; i++) {
          await apiRequest('POST', '/api/schedule-details', {
            scheduleId: newSchedule.id,
            roleId: role.id,
            status: "pending"
          });
        }
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      
      toast({
        title: "Escala criada",
        description: "A nova escala foi criada com sucesso!",
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast({
        title: "Erro ao criar escala",
        description: "Não foi possível criar a escala. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 text-blue-500 mr-3">
              <Calendar className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-medium text-blue-800">
              Nova Escala
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="space-y-1">
            <Label htmlFor="scheduleType">Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="scheduleType">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Culto Regular</SelectItem>
                <SelectItem value="event">Evento Especial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="scheduleDate">Data</Label>
            <Input 
              id="scheduleDate" 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="scheduleTime">Horário</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger id="scheduleTime">
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                {services?.map(service => (
                  <SelectItem key={service.id} value={service.time}>
                    {service.time}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="scheduleTeam">Time</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger id="scheduleTeam">
                <SelectValue placeholder="Selecione o time" />
              </SelectTrigger>
              <SelectContent>
                {teams?.map(team => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mb-5">
          <Label className="block mb-2">Funções Necessárias</Label>
          <div className="space-y-3 max-h-64 overflow-y-auto p-2">
            {roles.length > 0 ? (
              roles.map((role) => (
                <div key={role.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Checkbox 
                      id={`role-${role.id}`} 
                      checked={role.selected}
                      onCheckedChange={(checked) => 
                        handleRoleSelectionChange(role.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`role-${role.id}`} className="ml-2 text-sm text-slate-700">
                      {role.name}
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <Input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={role.count} 
                      onChange={(e) => 
                        handleRoleCountChange(role.id, parseInt(e.target.value) || 1)
                      }
                      className="w-16 px-2 py-1" 
                      disabled={!role.selected}
                    />
                  </div>
                </div>
              ))
            ) : teamId ? (
              <div className="text-center py-4 text-slate-500">
                Não há funções cadastradas para este time.
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500">
                Selecione um time para ver as funções disponíveis.
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Opções Avançadas</Label>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="option1" 
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <Label htmlFor="option1" className="text-sm text-slate-700">
                Gerar escala recorrente para todo o mês
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="option2" 
                checked={considerAvailability}
                onCheckedChange={(checked) => setConsiderAvailability(checked as boolean)}
              />
              <Label htmlFor="option2" className="text-sm text-slate-700">
                Considerar indisponibilidades cadastradas
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="option3" 
                checked={autoAssign}
                onCheckedChange={(checked) => setAutoAssign(checked as boolean)}
              />
              <Label htmlFor="option3" className="text-sm text-slate-700">
                Gerar escalação automática baseada em histórico
              </Label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar Escala"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
