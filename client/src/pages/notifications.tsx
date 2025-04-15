import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Search, 
  Bell, 
  CheckCircle, 
  AlertTriangle,
  ListFilter,
  Calendar,
  Repeat
} from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/date-utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
  });
  
  const { data: swapRequests, isLoading: isLoadingSwaps } = useQuery({
    queryKey: ['/api/swap-requests'],
  });
  
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest('POST', `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });
  
  const approveSwapMutation = useMutation({
    mutationFn: async (swapRequestId: number) => {
      return apiRequest('POST', `/api/swap-requests/${swapRequestId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });
  
  const rejectSwapMutation = useMutation({
    mutationFn: async (swapRequestId: number) => {
      return apiRequest('POST', `/api/swap-requests/${swapRequestId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    }
  });
  
  // Apply search and type filters to notifications
  const filteredNotifications = notifications?.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = 
      filterType === "all" || 
      notification.type === filterType;
      
    return matchesSearch && matchesType;
  });
  
  // Apply search filter to swap requests
  const filteredSwapRequests = swapRequests?.filter(request => {
    return (
      request.requestor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.swapDetails?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'conflict':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'swap_request':
        return <Repeat className="h-5 w-5 text-primary-500" />;
      case 'reminder':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };
  
  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50 font-sans">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 font-heading">Notificações</h1>
              
              <div className="mt-6 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="w-full md:w-72 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar notificações..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2 items-center">
                  <ListFilter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="conflict">Conflitos</SelectItem>
                      <SelectItem value="swap_request">Trocas</SelectItem>
                      <SelectItem value="reminder">Lembretes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Tabs defaultValue="notifications" className="mt-6">
                <TabsList>
                  <TabsTrigger value="notifications">
                    Notificações
                    {notifications?.filter(n => !n.read).length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {notifications?.filter(n => !n.read).length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="swap-requests">
                    Solicitações de Troca
                    {swapRequests?.filter(s => s.status === 'pending').length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {swapRequests?.filter(s => s.status === 'pending').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="notifications">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium">Notificações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="py-10 text-center">
                          <p className="text-gray-500">Carregando notificações...</p>
                        </div>
                      ) : filteredNotifications?.length === 0 ? (
                        <div className="py-10 text-center">
                          <p className="text-gray-500">Nenhuma notificação encontrada</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredNotifications?.map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`py-4 flex ${!notification.read ? 'bg-blue-50' : ''}`}
                            >
                              <div className="mr-4 flex-shrink-0 self-start pt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium">{notification.title}</h4>
                                  <div className="ml-2 flex-shrink-0 flex">
                                    <span className="text-xs text-gray-500">
                                      {formatDate(notification.createdAt, 'dd MMM, HH:mm')}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                              </div>
                              {!notification.read && (
                                <div className="ml-4 flex-shrink-0">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => markAsReadMutation.mutate(notification.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Marcar como lida
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="swap-requests">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-medium">Solicitações de Troca</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingSwaps ? (
                        <div className="py-10 text-center">
                          <p className="text-gray-500">Carregando solicitações...</p>
                        </div>
                      ) : filteredSwapRequests?.length === 0 ? (
                        <div className="py-10 text-center">
                          <p className="text-gray-500">Nenhuma solicitação de troca encontrada</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredSwapRequests?.map((request) => (
                            <div key={request.id} className="py-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <Avatar>
                                      <AvatarImage src={request.requestor.avatarUrl} alt={request.requestor.name} />
                                      <AvatarFallback>
                                        {request.requestor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{request.requestor.name}</div>
                                    <div className="text-xs text-gray-500">{request.teamName} ({request.roleName})</div>
                                  </div>
                                </div>
                                <div className="ml-2 flex-shrink-0 flex">
                                  {request.status === 'pending' && (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>
                                  )}
                                  {request.status === 'approved' && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovada</Badge>
                                  )}
                                  {request.status === 'rejected' && (
                                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitada</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-600">{request.swapDetails}</span>
                              </div>
                              {request.reason && (
                                <div className="mt-1 flex items-start">
                                  <span className="text-xs text-gray-500 mt-0.5 mr-2">Motivo:</span>
                                  <span className="text-sm text-gray-600">{request.reason}</span>
                                </div>
                              )}
                              
                              {request.status === 'pending' && (
                                <div className="mt-3 flex justify-end space-x-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => rejectSwapMutation.mutate(request.id)}
                                    disabled={rejectSwapMutation.isPending}
                                  >
                                    Rejeitar
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => approveSwapMutation.mutate(request.id)}
                                    disabled={approveSwapMutation.isPending}
                                  >
                                    Aprovar
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
