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

const volunteerFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  username: z.string().min(3, { message: "Nome de usuário deve ter no mínimo 3 caracteres" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
  teams: z.array(z.object({
    teamId: z.number(),
    roleId: z.number(),
    isTrainee: z.boolean().default(false),
  })).min(1, { message: "Selecione pelo menos um time" }),
});

type VolunteerFormValues = z.infer<typeof volunteerFormSchema>;

type VolunteerFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VolunteerForm({ open, onOpenChange }: VolunteerFormProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  
  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['/api/teams'],
  });
  
  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['/api/roles'],
  });

  const form = useForm<VolunteerFormValues>({
    resolver: zodResolver(volunteerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      teams: [],
    },
  });

  const createVolunteerMutation = useMutation({
    mutationFn: async (data: VolunteerFormValues) => {
      // First create the user
      const userResponse = await apiRequest('POST', '/api/users', {
        name: data.name,
        email: data.email,
        username: data.username,
        password: data.password,
        role: "volunteer"
      });
      
      const user = await userResponse.json();
      
      // Then create volunteer associations
      for (const team of data.teams) {
        await apiRequest('POST', '/api/volunteers', {
          userId: user.id,
          teamId: team.teamId,
          roleId: team.roleId,
          isTrainee: team.isTrainee,
        });
      }
      
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      onOpenChange(false);
      form.reset();
      setSelectedTeams([]);
    },
    onError: (error) => {
      setSubmissionError(error.message || "Erro ao criar voluntário. Tente novamente.");
    }
  });

  // Reset form and errors when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSubmissionError(null);
      form.reset();
      setSelectedTeams([]);
    }
  }, [open, form]);

  function onSubmit(data: VolunteerFormValues) {
    setSubmissionError(null);
    createVolunteerMutation.mutate(data);
  }

  // Handle team selection
  const handleTeamToggle = (teamId: number, checked: boolean) => {
    if (checked) {
      setSelectedTeams([...selectedTeams, teamId]);
      
      // Add a default entry for this team
      const currentTeams = form.getValues('teams') || [];
      const defaultRole = roles?.find(role => role.teamId === teamId)?.id || 0;
      
      form.setValue('teams', [
        ...currentTeams,
        { teamId, roleId: defaultRole, isTrainee: false }
      ]);
    } else {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
      
      // Remove entries for this team
      const currentTeams = form.getValues('teams') || [];
      form.setValue(
        'teams', 
        currentTeams.filter(team => team.teamId !== teamId)
      );
    }
  };

  // Update role for a team
  const updateTeamRole = (teamId: number, roleId: number) => {
    const currentTeams = form.getValues('teams') || [];
    const teamIndex = currentTeams.findIndex(t => t.teamId === teamId);
    
    if (teamIndex >= 0) {
      const updatedTeams = [...currentTeams];
      updatedTeams[teamIndex] = {
        ...updatedTeams[teamIndex],
        roleId,
      };
      form.setValue('teams', updatedTeams);
    }
  };

  // Update trainee status for a team
  const updateTraineeStatus = (teamId: number, isTrainee: boolean) => {
    const currentTeams = form.getValues('teams') || [];
    const teamIndex = currentTeams.findIndex(t => t.teamId === teamId);
    
    if (teamIndex >= 0) {
      const updatedTeams = [...currentTeams];
      updatedTeams[teamIndex] = {
        ...updatedTeams[teamIndex],
        isTrainee,
      };
      form.setValue('teams', updatedTeams);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Novo Voluntário</DialogTitle>
          <DialogDescription>
            Adicione um novo voluntário e associe a times e funções.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do voluntário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
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
                    <FormLabel>Times</FormLabel>
                    <FormDescription>
                      Selecione os times que o voluntário participa
                    </FormDescription>
                  </div>
                  
                  {isLoadingTeams ? (
                    <div className="text-sm">Carregando times...</div>
                  ) : (
                    <div className="space-y-4">
                      {teams?.map((team) => (
                        <div key={team.id} className="border rounded-md p-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`team-${team.id}`}
                              checked={selectedTeams.includes(team.id)}
                              onCheckedChange={(checked) => {
                                handleTeamToggle(team.id, !!checked);
                              }}
                            />
                            <label
                              htmlFor={`team-${team.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {team.name}
                            </label>
                          </div>
                          
                          {selectedTeams.includes(team.id) && (
                            <div className="mt-4 pl-6 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm text-gray-500 mb-1 block">Função</label>
                                  <Select 
                                    onValueChange={(value) => updateTeamRole(team.id, parseInt(value))}
                                    defaultValue={
                                      roles?.find(role => role.teamId === team.id)?.id.toString() || ""
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Selecione uma função" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles
                                        ?.filter(role => role.teamId === team.id)
                                        .map(role => (
                                          <SelectItem key={role.id} value={role.id.toString()}>
                                            {role.name}
                                          </SelectItem>
                                        ))
                                      }
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="flex items-start pt-6">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`trainee-${team.id}`}
                                      onCheckedChange={(checked) => {
                                        updateTraineeStatus(team.id, !!checked);
                                      }}
                                    />
                                    <label
                                      htmlFor={`trainee-${team.id}`}
                                      className="text-sm font-normal leading-none"
                                    >
                                      Em treinamento
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
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
                disabled={createVolunteerMutation.isPending}
              >
                {createVolunteerMutation.isPending ? "Criando..." : "Criar Voluntário"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
