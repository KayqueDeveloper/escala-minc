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

const roleFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }),
  teamId: z.number({ required_error: "Time é obrigatório" }),
  description: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

type RoleFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId?: number;
};

export function RoleForm({ open, onOpenChange, teamId }: RoleFormProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['/api/teams'],
  });

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      teamId: teamId || 0,
      description: "",
    },
  });

  // Set teamId when it changes
  useEffect(() => {
    if (teamId) {
      form.setValue('teamId', teamId);
    }
  }, [teamId, form]);

  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleFormValues) => {
      return apiRequest('POST', '/api/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      setSubmissionError(error.message || "Erro ao criar função. Tente novamente.");
    }
  });

  // Reset form and errors when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSubmissionError(null);
      form.reset();
      if (teamId) {
        form.setValue('teamId', teamId);
      }
    }
  }, [open, form, teamId]);

  function onSubmit(data: RoleFormValues) {
    setSubmissionError(null);
    createRoleMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Nova Função</DialogTitle>
          <DialogDescription>
            Crie uma nova função para um time.
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Função</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Coordenador, Vmix, Diretor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={!!teamId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingTeams ? (
                        <SelectItem value="loading" disabled>
                          Carregando times...
                        </SelectItem>
                      ) : (
                        teams?.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Time ao qual esta função pertence
                  </FormDescription>
                  <FormMessage />
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
                      placeholder="Descreva as responsabilidades desta função"
                      className="resize-none"
                      {...field}
                      value={field.value || ""}
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
                disabled={createRoleMutation.isPending}
              >
                {createRoleMutation.isPending ? "Criando..." : "Criar Função"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
