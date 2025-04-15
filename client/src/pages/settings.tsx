import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Save, User, Key, Lock, Mail, ShieldAlert } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileFormSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: "Senha atual é obrigatória" }),
  newPassword: z.string().min(6, { message: "Nova senha deve ter no mínimo 6 caracteres" }),
  confirmPassword: z.string().min(6, { message: "Confirme a nova senha" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "Líder Silva",
      email: "lider.silva@igreja.org",
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // In a real app, we would send this to the server
      return apiRequest('PATCH', '/api/users/profile', data);
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Ocorreu um erro ao atualizar seu perfil. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      // In a real app, we would send this to the server
      return apiRequest('POST', '/api/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso.",
      });
      passwordForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message || "Ocorreu um erro ao atualizar sua senha. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  function onProfileSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data);
  }
  
  function onPasswordSubmit(data: PasswordFormValues) {
    updatePasswordMutation.mutate(data);
  }
  
  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50 font-sans">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 font-heading">Configurações</h1>
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="grid w-full md:w-96 grid-cols-2">
                  <TabsTrigger value="profile">
                    <User className="h-4 w-4 mr-2" />
                    Meu Perfil
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Lock className="h-4 w-4 mr-2" />
                    Segurança
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile">
                  <Card>
                    <CardHeader>
                      <CardTitle>Meu Perfil</CardTitle>
                      <CardDescription>
                        Atualize suas informações pessoais
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
                        <div className="flex flex-col items-center">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src="" alt="Sua foto de perfil" />
                            <AvatarFallback className="text-2xl">LS</AvatarFallback>
                          </Avatar>
                          <Button variant="outline" size="sm" className="mt-4">
                            Alterar foto
                          </Button>
                        </div>
                        
                        <div className="flex-1">
                          <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                              <FormField
                                control={profileForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome Completo</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Seu nome" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input type="email" placeholder="seu.email@igreja.org" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div className="flex justify-end">
                                <Button 
                                  type="submit" 
                                  disabled={updateProfileMutation.isPending}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Segurança</CardTitle>
                      <CardDescription>
                        Gerenciar sua senha e configurações de segurança
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium flex items-center">
                            <Key className="h-5 w-5 mr-2 text-gray-500" />
                            Alterar Senha
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Atualize sua senha para manter sua conta segura
                          </p>
                        </div>
                        
                        <Form {...passwordForm}>
                          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                            <FormField
                              control={passwordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Senha Atual</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="Sua senha atual" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nova Senha</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="Nova senha" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    Sua senha deve ter pelo menos 6 caracteres
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={passwordForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirmar Nova Senha</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="Confirme sua nova senha" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="flex justify-end pt-2">
                              <Button 
                                type="submit" 
                                disabled={updatePasswordMutation.isPending}
                              >
                                {updatePasswordMutation.isPending ? "Atualizando..." : "Atualizar Senha"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                        
                        <div className="border-t border-gray-200 pt-6 mt-8">
                          <div>
                            <h3 className="text-lg font-medium flex items-center">
                              <Mail className="h-5 w-5 mr-2 text-gray-500" />
                              Notificações
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Gerencie como você recebe notificações
                            </p>
                          </div>
                          
                          <div className="mt-4">
                            {/* Notification settings would go here */}
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-6 mt-8">
                          <div>
                            <h3 className="text-lg font-medium flex items-center text-red-600">
                              <ShieldAlert className="h-5 w-5 mr-2" />
                              Zona de Perigo
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Ações irreversíveis para sua conta
                            </p>
                          </div>
                          
                          <div className="mt-4">
                            <Button variant="destructive">
                              Desativar Minha Conta
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
