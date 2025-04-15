import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, insertUserSchema, Team, Role } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
import { Checkbox } from "@/components/ui/checkbox";
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

// Extend the insertUserSchema with additional validation
const volunteerFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres",
  }),
  teams: z.array(z.number()).optional(),
  roles: z.record(z.string(), z.number()).optional(),
  isTrainee: z.record(z.string(), z.boolean()).optional(),
});

// Add validation to ensure passwords match
const validatedSchema = volunteerFormSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  }
);

type VolunteerFormValues = z.infer<typeof validatedSchema>;

interface VolunteerFormProps {
  volunteer?: User;
  onSuccess?: () => void;
}

export default function VolunteerForm({ volunteer, onSuccess }: VolunteerFormProps) {
  const { toast } = useToast();
  const [selectedTeams, setSelectedTeams] = useState<number[]>(volunteer?.teams || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get teams data
  const { data: teams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  // Initialize form
  const form = useForm<VolunteerFormValues>({
    resolver: zodResolver(validatedSchema),
    defaultValues: {
      username: volunteer?.username || "",
      password: volunteer ? "********" : "", // Don't show actual password
      confirmPassword: volunteer ? "********" : "",
      name: volunteer?.name || "",
      email: volunteer?.email || "",
      phone: volunteer?.phone || "",
      role: volunteer?.role || "volunteer",
      isAdmin: volunteer?.isAdmin || false,
      teams: volunteer?.teams || [],
      roles: {},
      isTrainee: {},
    },
  });

  // Get roles for each selected team
  const roleQueries = selectedTeams.map(teamId =>
    useQuery<Role[]>({
      queryKey: ['/api/teams', teamId, 'roles'],
      enabled: !!teamId,
    })
  );

  const isLoadingRoles = roleQueries.some(query => query.isLoading);

  const onSubmit = async (data: VolunteerFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Prepare user data
      const userData = {
        username: data.username,
        password: data.password,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        isAdmin: data.isAdmin,
      };
      
      let userId: number;
      
      if (volunteer) {
        // Update existing user
        const response = await apiRequest('PUT', `/api/users/${volunteer.id}`, userData);
        const updatedUser = await response.json();
        userId = updatedUser.id;
      } else {
        // Create new user
        const response = await apiRequest('POST', '/api/users', userData);
        const newUser = await response.json();
        userId = newUser.id;
      }
      
      // Handle team memberships
      if (selectedTeams && selectedTeams.length > 0) {
        for (const teamId of selectedTeams) {
          const roleId = data.roles ? data.roles[teamId.toString()] : undefined;
          const isTrainee = data.isTrainee ? data.isTrainee[teamId.toString()] : false;
          
          if (roleId) {
            // Create team member record
            await apiRequest('POST', '/api/team-members', {
              userId,
              teamId,
              roleId,
              isTrainee: !!isTrainee,
            });
          }
        }
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/team-members'] });
      
      toast({
        title: volunteer ? "Voluntário atualizado" : "Voluntário cadastrado",
        description: volunteer 
          ? "O voluntário foi atualizado com sucesso"
          : "O novo voluntário foi cadastrado com sucesso",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving volunteer:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o voluntário",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeamChange = (teamId: number, checked: boolean) => {
    if (checked) {
      setSelectedTeams([...selectedTeams, teamId]);
    } else {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Dados básicos do voluntário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função na Igreja</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="volunteer">Voluntário</SelectItem>
                          <SelectItem value="leader">Líder</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados de Acesso</CardTitle>
              <CardDescription>
                Informações para acesso ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="nome.usuario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Administrador do Sistema
                        </FormLabel>
                        <FormDescription>
                          Permitir acesso administrativo completo
                        </FormDescription>
                      </div>
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
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Times e Funções</CardTitle>
              <CardDescription>
                Selecione os times e funções deste voluntário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <FormLabel>Times</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {teams?.map((team) => (
                      <div key={team.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`team-${team.id}`}
                          checked={selectedTeams.includes(team.id)}
                          onCheckedChange={(checked) => 
                            handleTeamChange(team.id, checked as boolean)
                          }
                        />
                        <div>
                          <label
                            htmlFor={`team-${team.id}`}
                            className="font-medium text-sm"
                          >
                            {team.name}
                          </label>
                          {selectedTeams.includes(team.id) && (
                            <div className="mt-2 ml-2 space-y-2">
                              {isLoadingRoles ? (
                                <div className="flex items-center">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span className="text-xs text-slate-500">Carregando funções...</span>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <FormLabel className="text-xs">Função no time:</FormLabel>
                                    <Select
                                      onValueChange={(value) => 
                                        form.setValue(`roles.${team.id}`, parseInt(value))
                                      }
                                    >
                                      <SelectTrigger className="h-8 text-xs mt-1">
                                        <SelectValue placeholder="Selecione uma função" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {roleQueries.find(q => q.data?.[0]?.teamId === team.id)?.data?.map((role) => (
                                          <SelectItem key={role.id} value={role.id.toString()}>
                                            {role.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`trainee-${team.id}`}
                                      onCheckedChange={(checked) => 
                                        form.setValue(`isTrainee.${team.id}`, checked as boolean)
                                      }
                                    />
                                    <label
                                      htmlFor={`trainee-${team.id}`}
                                      className="text-xs"
                                    >
                                      Em treinamento
                                    </label>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {volunteer ? "Atualizar Voluntário" : "Cadastrar Voluntário"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
}
