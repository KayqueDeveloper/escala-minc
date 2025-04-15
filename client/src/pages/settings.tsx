import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { User, Team, Role, AvailabilityRule } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Save, Calendar, Clock, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("profile");

  // Fetch user's profile data
  const { data: userData, isLoading: userLoading } = useQuery<User>({
    queryKey: user ? ['/api/users', user.id] : null,
    enabled: !!user,
  });

  // Fetch teams for availability settings
  const { data: teams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  // Fetch services 
  const { data: services } = useQuery<any[]>({
    queryKey: ['/api/services'],
  });

  // Fetch user's availability rules
  const { data: availabilityRules } = useQuery<AvailabilityRule[]>({
    queryKey: user ? ['/api/availability-rules', { userId: user.id }] : null,
    enabled: !!user,
  });

  // Profile update form
  const profileFormSchema = z.object({
    name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
    email: z.string().email({ message: "Email inválido" }),
    phone: z.string().min(8, { message: "Telefone inválido" }),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  }).refine(data => {
    // If any password field is filled, all should be filled
    const hasCurrentPassword = !!data.currentPassword;
    const hasNewPassword = !!data.newPassword;
    const hasConfirmPassword = !!data.confirmPassword;
    
    if (hasCurrentPassword || hasNewPassword || hasConfirmPassword) {
      return hasCurrentPassword && hasNewPassword && hasConfirmPassword;
    }
    return true;
  }, {
    message: "Todos os campos de senha devem ser preenchidos",
    path: ["newPassword"],
  }).refine(data => {
    // New password and confirm password should match
    if (data.newPassword && data.confirmPassword) {
      return data.newPassword === data.confirmPassword;
    }
    return true;
  }, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userData?.name || "",
      email: userData?.email || "",
      phone: userData?.phone || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form values when user data loads
  if (userData && !userLoading && profileForm.getValues().name === "") {
    profileForm.reset({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }

  // Handle profile update
  const handleProfileUpdate = async (data: z.infer<typeof profileFormSchema>) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      const updateData: Partial<User> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
      };
      
      if (data.newPassword) {
        // In a real app, we'd verify the current password before allowing the change
        updateData.password = data.newPassword;
      }
      
      await apiRequest('PUT', `/api/users/${user.id}`, updateData);
      
      // Update user in local storage if needed
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...storedUser,
        name: data.name,
        email: data.email,
        phone: data.phone,
      }));
      
      // Invalidate user query to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/users', user.id] });
      
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      
      // Clear password fields
      profileForm.setValue('currentPassword', '');
      profileForm.setValue('newPassword', '');
      profileForm.setValue('confirmPassword', '');
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar seu perfil.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle creating or updating availability rule
  const handleSetAvailability = async (type: 'service' | 'date', id: number | string, isAvailable: boolean) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Check if rule already exists
      let existingRule = null;
      
      if (type === 'service') {
        existingRule = availabilityRules?.find(rule => {
          const ruleData = rule.rule as any;
          return ruleData.type === 'service' && ruleData.serviceId === id;
        });
      } else if (type === 'date') {
        existingRule = availabilityRules?.find(rule => {
          const ruleData = rule.rule as any;
          return ruleData.type === 'date' && ruleData.date === id;
        });
      }
      
      if (existingRule) {
        // Update existing rule
        await apiRequest('PUT', `/api/availability-rules/${existingRule.id}`, {
          rule: {
            type,
            [type === 'service' ? 'serviceId' : 'date']: id,
            isAvailable,
          }
        });
      } else {
        // Create new rule
        await apiRequest('POST', '/api/availability-rules', {
          userId: user.id,
          description: type === 'service' 
            ? `Disponibilidade para culto ${id}` 
            : `Disponibilidade para data ${id}`,
          rule: {
            type,
            [type === 'service' ? 'serviceId' : 'date']: id,
            isAvailable,
          }
        });
      }
      
      // Invalidate availability rules query to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/availability-rules'] });
      
      toast({
        title: "Disponibilidade atualizada",
        description: "Sua disponibilidade foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      toast({
        title: "Erro ao atualizar disponibilidade",
        description: "Não foi possível atualizar sua disponibilidade.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if a service has an availability rule
  const getServiceAvailability = (serviceId: number) => {
    if (!availabilityRules) return true; // Default to available
    
    const rule = availabilityRules.find(rule => {
      const ruleData = rule.rule as any;
      return ruleData.type === 'service' && ruleData.serviceId === serviceId;
    });
    
    return rule ? (rule.rule as any).isAvailable : true;
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Header title="Configurações" subtitle="Preferências e configurações pessoais" />
          
          <Tabs 
            defaultValue="profile" 
            value={currentTab}
            onValueChange={setCurrentTab}
            className="space-y-6"
          >
            <Card>
              <CardContent className="pt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Perfil</TabsTrigger>
                  <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
                  <TabsTrigger value="notifications">Notificações</TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais e de acesso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form 
                      onSubmit={profileForm.handleSubmit(handleProfileUpdate)} 
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
                        <div className="space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Senha Atual</FormLabel>
                                <FormControl>
                                  <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={profileForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nova Senha</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirmar Senha</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="availability">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2 h-5 w-5" />
                      Disponibilidade por Culto
                    </CardTitle>
                    <CardDescription>
                      Defina sua disponibilidade para os cultos regulares
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {services?.map(service => (
                        <div key={service.id} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-slate-500">Todo domingo às {service.time}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {getServiceAvailability(service.id) ? "Disponível" : "Indisponível"}
                            </span>
                            <Switch 
                              checked={getServiceAvailability(service.id)}
                              onCheckedChange={(checked) => 
                                handleSetAvailability('service', service.id, checked)
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Disponibilidade por Data
                    </CardTitle>
                    <CardDescription>
                      Defina datas específicas em que você não está disponível
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Adicionar data indisponível</label>
                        <div className="flex gap-2">
                          <Input 
                            type="date" 
                            className="flex-1"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <Button variant="secondary">Adicionar</Button>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-2">Datas indisponíveis</h4>
                        {availabilityRules?.filter(rule => {
                          const ruleData = rule.rule as any;
                          return ruleData.type === 'date' && !ruleData.isAvailable;
                        }).length ? (
                          <div className="space-y-2">
                            {availabilityRules?.filter(rule => {
                              const ruleData = rule.rule as any;
                              return ruleData.type === 'date' && !ruleData.isAvailable;
                            }).map(rule => {
                              const ruleData = rule.rule as any;
                              const dateObj = new Date(ruleData.date);
                              return (
                                <div key={rule.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                                  <span>{dateObj.toLocaleDateString('pt-BR')}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      // Delete rule or make available
                                      handleSetAvailability('date', ruleData.date, true);
                                    }}
                                  >
                                    Remover
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-8 border rounded-md bg-slate-50">
                            <p className="text-slate-500">Nenhuma data indisponível cadastrada</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Notificação</CardTitle>
                  <CardDescription>
                    Configure como deseja receber notificações do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notificação de Nova Escala</h4>
                        <p className="text-sm text-slate-500">Receba notificações quando for escalado</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Lembretes de Escala</h4>
                        <p className="text-sm text-slate-500">Receba lembretes antes dos cultos em que está escalado</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Respostas de Solicitações</h4>
                        <p className="text-sm text-slate-500">Receba notificações quando suas solicitações de troca forem respondidas</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notificações por Email</h4>
                        <p className="text-sm text-slate-500">Receba notificações também por email</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Notificações por WhatsApp</h4>
                        <p className="text-sm text-slate-500">Receba notificações também por WhatsApp</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Preferências
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
