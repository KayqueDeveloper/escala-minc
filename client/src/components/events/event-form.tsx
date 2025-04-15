import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const eventFormSchema = z.object({
  title: z.string().min(3, { message: "Título deve ter no mínimo 3 caracteres" }),
  description: z.string().optional(),
  location: z.string().min(2, { message: "Local é obrigatório" }),
  eventDate: z.string().min(1, { message: "Data é obrigatória" }),
  eventTime: z.string().min(1, { message: "Horário é obrigatório" }),
  eventType: z.string().min(1, { message: "Tipo de evento é obrigatório" }),
  recurrent: z.boolean().default(false),
  teamIds: z.array(z.number()).min(1, { message: "Selecione pelo menos um time" }),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

type EventFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EventForm({ open, onOpenChange }: EventFormProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['/api/teams'],
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "Auditório Principal",
      eventDate: new Date().toISOString().split('T')[0],
      eventTime: "09:00",
      eventType: "regular_service",
      recurrent: false,
      teamIds: [],
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      // Combine date and time
      const eventDateTime = new Date(`${data.eventDate}T${data.eventTime}`);
      
      const eventData = {
        title: data.title,
        description: data.description,
        location: data.location,
        eventDate: eventDateTime.toISOString(),
        eventType: data.eventType,
        recurrent: data.recurrent,
        teamIds: data.teamIds,
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
      setSubmissionError(error.message || "Erro ao criar evento. Tente novamente.");
    }
  });

  // Reset form and errors when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSubmissionError(null);
      form.reset();
    }
  }, [open, form]);

  function onSubmit(data: EventFormValues) {
    setSubmissionError(null);
    createEventMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Novo Evento</DialogTitle>
          <DialogDescription>
            Crie um novo culto ou evento especial.
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Culto de Celebração" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Auditório Principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                        <SelectItem value="regular_service">Culto Regular</SelectItem>
                        <SelectItem value="special_event">Evento Especial</SelectItem>
                        <SelectItem value="conference">Conferência</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
              name="recurrent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Evento recorrente
                    </FormLabel>
                    <FormDescription>
                      Marque esta opção para eventos que ocorrem regularmente
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o evento"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="teamIds"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel>Times Envolvidos</FormLabel>
                    <FormDescription>
                      Selecione os times que participarão deste evento
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
                          name="teamIds"
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
                disabled={createEventMutation.isPending}
              >
                {createEventMutation.isPending ? "Criando..." : "Criar Evento"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
