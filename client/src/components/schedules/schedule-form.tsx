import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const scheduleFormSchema = z.object({
  eventType: z.string().min(1, { message: "Tipo de evento é obrigatório" }),
  eventDate: z.string().min(1, { message: "Data é obrigatória" }),
  eventTime: z.string().min(1, { message: "Horário é obrigatório" }),
  teams: z.array(z.number()).min(1, { message: "Selecione pelo menos um time" }),
  notes: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

type ScheduleFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ScheduleForm({ open, onOpenChange }: ScheduleFormProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['/api/teams'],
  });

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      eventType: "regular_service",
      eventDate: format(new Date(), "yyyy-MM-dd"),
      eventTime: "09:00",
      teams: [],
      notes: "",
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormValues) => {
      // Combine date and time
      const eventDateTime = new Date(`${data.eventDate}T${data.eventTime}`);
      
      const eventData = {
        title: data.eventType === "regular_service" ? "Culto de Celebração" : "Evento Especial",
        description: data.notes,
        location: "Auditório Principal",
        eventDate: eventDateTime.toISOString(),
        eventType: data.eventType,
        teamIds: data.teams,
      };
      
      return apiRequest('POST', '/api/events', eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      setSubmissionError(error.message || "Erro ao criar escala. Tente novamente.");
    }
  });

  // Reset form and errors when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSubmissionError(null);
      form.reset();
    }
  }, [open, form]);

  function onSubmit(data: ScheduleFormValues) {
    setSubmissionError(null);
    createScheduleMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Nova Escala</DialogTitle>
          <DialogDescription>
            Crie uma nova escala para culto ou evento especial.
          </DialogDescription>
        </DialogHeader>
        
        {submissionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{submissionError}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de evento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="regular_service">Culto de Domingo</SelectItem>
                      <SelectItem value="weekday_service">Culto de Semana</SelectItem>
                      <SelectItem value="special_event">Evento Especial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="eventTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="teams"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>Times Envolvidos</FormLabel>
                    <FormDescription>
                      Selecione os times que participarão desta escala
                    </FormDescription>
                  </div>
                  {isLoadingTeams ? (
                    <div className="text-sm">Carregando times...</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {teams?.map((team) => (
                        <FormField
                          key={team.id}
                          control={form.control}
                          name="teams"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={team.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(team.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, team.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== team.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {team.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione notas ou instruções para os voluntários"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createScheduleMutation.isPending}
              >
                {createScheduleMutation.isPending ? "Criando..." : "Criar Escala"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
