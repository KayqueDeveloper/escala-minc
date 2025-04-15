import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Team, insertTeamSchema, User, Role, InsertRole } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Use the existing insertTeamSchema but with extra validation if needed
const teamFormSchema = insertTeamSchema;

type TeamFormValues = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  team?: Team;
  onSuccess?: () => void;
}

export default function TeamForm({ team, onSuccess }: TeamFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<{ id?: number; name: string }[]>(
    team?.roles?.map(role => ({ id: role.id, name: role.name })) || []
  );

  // Get users with leader role
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Filter to get only leaders
  const leaders = users?.filter(user => user.role === 'leader' || user.role === 'admin');

  // Initialize form
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name || "",
      description: team?.description || "",
      leaderId: team?.leaderId,
    },
  });

  const onSubmit = async (data: TeamFormValues) => {
    try {
      setIsSubmitting(true);
      
      let teamId: number;
      
      if (team) {
        // Update existing team
        const response = await apiRequest('PUT', `/api/teams/${team.id}`, data);
        const updatedTeam = await response.json();
        teamId = updatedTeam.id;
      } else {
        // Create new team
        const response = await apiRequest('POST', '/api/teams', data);
        const newTeam = await response.json();
        teamId = newTeam.id;
      }
      
      // Handle roles
      // First, we need to get existing roles to know which ones to delete
      if (team) {
        const existingRoles = await fetch(`/api/teams/${teamId}/roles`).then(res => res.json());
        
        // Delete roles that were removed
        for (const existingRole of existingRoles) {
          const roleExists = roles.some(r => r.id === existingRole.id);
          if (!roleExists) {
            await apiRequest('DELETE', `/api/roles/${existingRole.id}`, undefined);
          }
        }
      }
      
      // Create/update roles
      for (const role of roles) {
        const roleData: InsertRole = {
          name: role.name,
          teamId: teamId,
        };
        
        if (role.id) {
          // Update existing role
          await apiRequest('PUT', `/api/roles/${role.id}`, roleData);
        } else {
          // Create new role
          await apiRequest('POST', '/api/roles', roleData);
        }
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      
      toast({
        title: team ? "Time atualizado" : "Time criado",
        description: team 
          ? "O time foi atualizado com sucesso"
          : "O novo time foi criado com sucesso",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving team:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o time",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRole = () => {
    setRoles([...roles, { name: "" }]);
  };

  const updateRole = (index: number, name: string) => {
    const newRoles = [...roles];
    newRoles[index].name = name;
    setRoles(newRoles);
  };

  const removeRole = (index: number) => {
    const newRoles = [...roles];
    newRoles.splice(index, 1);
    setRoles(newRoles);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Time</CardTitle>
              <CardDescription>
                Dados básicos do time ou ministério
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Time</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Transmissão, Louvor, Kids" {...field} />
                    </FormControl>
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
                        placeholder="Descreva o propósito e atividades deste time"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="leaderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Líder do Time</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um líder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaders?.map((leader) => (
                          <SelectItem key={leader.id} value={leader.id.toString()}>
                            {leader.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Apenas usuários com papel de líder ou administrador podem ser selecionados.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Funções do Time</span>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addRole}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Função
                </Button>
              </CardTitle>
              <CardDescription>
                Configure as funções disponíveis para este time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.length > 0 ? (
                  roles.map((role, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <Input
                          value={role.name}
                          onChange={(e) => updateRole(index, e.target.value)}
                          placeholder="Nome da função"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRole(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500">
                    Nenhuma função adicionada. Clique em "Adicionar Função" para começar.
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {team ? "Atualizar Time" : "Criar Time"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
}
