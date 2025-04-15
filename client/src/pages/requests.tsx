import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SwapRequest, User, ScheduleDetail, Schedule, Team, Role, Service } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, X, Filter, Clock, Search, Badge, CalendarCheck, Calendar } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function Requests() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Fetch swap requests
  const { data: requests, isLoading: requestsLoading } = useQuery<SwapRequest[]>({
    queryKey: ['/api/swap-requests'],
  });
  
  // Fetch users for names
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Filter requests based on status
  const filteredRequests = requests?.filter(request => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  }) || [];

  // Helper function to get request details
  const useRequestDetails = (requestId: number) => {
    const request = requests?.find(req => req.id === requestId);
    
    // Fetch schedule detail for this request
    const { data: scheduleDetail } = useQuery<ScheduleDetail>({
      queryKey: ['/api/schedule-details', request?.scheduleDetailId],
      enabled: !!request?.scheduleDetailId,
    });
    
    // Fetch schedule for this detail
    const { data: schedule } = useQuery<Schedule>({
      queryKey: ['/api/schedules', scheduleDetail?.scheduleId],
      enabled: !!scheduleDetail?.scheduleId,
    });
    
    // Fetch team for this schedule
    const { data: team } = useQuery<Team>({
      queryKey: ['/api/teams', schedule?.teamId],
      enabled: !!schedule?.teamId,
    });
    
    // Fetch service for this schedule
    const { data: service } = useQuery<Service>({
      queryKey: ['/api/services', schedule?.serviceId],
      enabled: !!schedule?.serviceId,
    });
    
    // Fetch role for this detail
    const { data: role } = useQuery<Role>({
      queryKey: ['/api/roles', scheduleDetail?.roleId],
      enabled: !!scheduleDetail?.roleId,
    });
    
    // Get requester and replacement user details
    const requester = users?.find(u => u.id === request?.requesterId);
    const replacement = users?.find(u => u.id === request?.replacementId);
    
    return { 
      request, 
      scheduleDetail, 
      schedule, 
      team, 
      service, 
      role, 
      requester, 
      replacement 
    };
  };
  
  // Handle request approval
  const handleApprove = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await apiRequest('PUT', `/api/swap-requests/${requestId}`, {
        status: 'approved',
        resolvedBy: user?.id,
        resolvedAt: new Date().toISOString()
      });
      
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule-details'] });
      
      toast({
        title: "Solicitação aprovada",
        description: "A troca foi processada com sucesso",
      });
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar a solicitação",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle request rejection
  const handleReject = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await apiRequest('PUT', `/api/swap-requests/${requestId}`, {
        status: 'rejected',
        resolvedBy: user?.id,
        resolvedAt: new Date().toISOString()
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
      
      toast({
        title: "Solicitação recusada",
        description: "A solicitação de troca foi recusada",
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Erro ao recusar",
        description: "Não foi possível recusar a solicitação",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };
  
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Header title="Solicitações" subtitle="Gerenciamento de trocas e substituições" />
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <Tabs defaultValue="pending" onValueChange={setStatusFilter}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="pending">Pendentes</TabsTrigger>
                    <TabsTrigger value="approved">Aprovadas</TabsTrigger>
                    <TabsTrigger value="rejected">Recusadas</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Buscar voluntário..."
                      className="w-56"
                    />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <TabsContent value="pending" className="space-y-4">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(request => {
                      const { 
                        scheduleDetail, 
                        schedule, 
                        team, 
                        service, 
                        role, 
                        requester, 
                        replacement 
                      } = useRequestDetails(request.id);
                      
                      // Format the time ago string
                      const timeAgo = request.createdAt ? 
                        formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ptBR }) :
                        '';
                      
                      // Get date and service/event name
                      const dateStr = schedule?.date ? 
                        format(new Date(schedule.date), 'dd/MM/yyyy') : 
                        '--/--/----';
                      
                      return (
                        <Card key={request.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold">
                                  {requester?.name?.charAt(0) || '?'}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                                  <h3 className="font-medium">{requester?.name || 'Carregando...'}</h3>
                                  <div className="flex items-center text-sm text-slate-500">
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{timeAgo}</span>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-slate-600 mb-3">
                                  Solicitou {replacement ? 'troca' : 'substituição'} no culto do dia <span className="font-medium">{dateStr}</span>
                                </p>
                                
                                <div className="bg-slate-50 p-3 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-xs text-slate-500">Time</span>
                                    <p className="text-sm font-medium">{team?.name || 'Carregando...'}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-500">Função</span>
                                    <p className="text-sm font-medium">{role?.name || 'Carregando...'}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-500">Culto</span>
                                    <p className="text-sm font-medium">{service?.time || 'Evento Especial'}</p>
                                  </div>
                                  {replacement && (
                                    <div>
                                      <span className="text-xs text-slate-500">Substituição</span>
                                      <p className="text-sm font-medium">{replacement.name}</p>
                                    </div>
                                  )}
                                </div>
                                
                                {request.reason && (
                                  <div className="mb-4">
                                    <span className="text-xs text-slate-500">Motivo</span>
                                    <p className="text-sm mt-1">{request.reason}</p>
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-2">
                                  <Button
                                    onClick={() => handleApprove(request.id)}
                                    disabled={processingId === request.id}
                                    className="w-28"
                                  >
                                    {processingId === request.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 mr-1" />
                                        Aprovar
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleReject(request.id)}
                                    disabled={processingId === request.id}
                                    className="w-28"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Recusar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <CalendarCheck className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium">Nenhuma solicitação pendente</h3>
                        <p className="text-slate-500 mt-2">
                          {requestsLoading 
                            ? "Carregando solicitações..." 
                            : "Não há solicitações de troca pendentes no momento."}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="approved" className="space-y-4">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(request => {
                      const { 
                        scheduleDetail, 
                        schedule, 
                        team, 
                        role, 
                        requester, 
                        replacement 
                      } = useRequestDetails(request.id);
                      
                      // Get date
                      const dateStr = schedule?.date ? 
                        format(new Date(schedule.date), 'dd/MM/yyyy') : 
                        '--/--/----';
                      
                      // Get resolver name
                      const resolver = users?.find(u => u.id === request.resolvedBy);
                      
                      // Format resolved date
                      const resolvedDate = request.resolvedAt ? 
                        format(new Date(request.resolvedAt), 'dd/MM/yyyy HH:mm') : 
                        '';
                      
                      return (
                        <Card key={request.id} className="bg-green-50 border-green-100">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <Badge className="h-6 w-6 text-green-500" />
                              <h3 className="font-medium text-green-800">Substituição Aprovada</h3>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-sm text-slate-600">
                                <span className="font-medium">{requester?.name}</span> foi 
                                {replacement ? ' substituído por ' : ' dispensado da escala de '}
                                {replacement && <span className="font-medium">{replacement.name}</span>} no 
                                dia <span className="font-medium">{dateStr}</span>.
                              </p>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-slate-500">Time</span>
                                <p className="text-sm font-medium">{team?.name || 'Carregando...'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500">Função</span>
                                <p className="text-sm font-medium">{role?.name || 'Carregando...'}</p>
                              </div>
                            </div>
                            
                            <div className="text-xs text-green-700">
                              Aprovado por {resolver?.name || 'Sistema'} em {resolvedDate}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Check className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium">Nenhuma solicitação aprovada</h3>
                        <p className="text-slate-500 mt-2">
                          {requestsLoading 
                            ? "Carregando solicitações..." 
                            : "Não há solicitações de troca aprovadas para exibir."}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="rejected" className="space-y-4">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map(request => {
                      const { 
                        scheduleDetail, 
                        schedule, 
                        team, 
                        role, 
                        requester 
                      } = useRequestDetails(request.id);
                      
                      // Get date
                      const dateStr = schedule?.date ? 
                        format(new Date(schedule.date), 'dd/MM/yyyy') : 
                        '--/--/----';
                      
                      // Get resolver name
                      const resolver = users?.find(u => u.id === request.resolvedBy);
                      
                      // Format resolved date
                      const resolvedDate = request.resolvedAt ? 
                        format(new Date(request.resolvedAt), 'dd/MM/yyyy HH:mm') : 
                        '';
                      
                      return (
                        <Card key={request.id} className="bg-red-50 border-red-100">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <X className="h-6 w-6 text-red-500" />
                              <h3 className="font-medium text-red-800">Substituição Recusada</h3>
                            </div>
                            
                            <div className="mb-4">
                              <p className="text-sm text-slate-600">
                                A solicitação de <span className="font-medium">{requester?.name}</span> para 
                                o dia <span className="font-medium">{dateStr}</span> foi recusada.
                              </p>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-slate-500">Time</span>
                                <p className="text-sm font-medium">{team?.name || 'Carregando...'}</p>
                              </div>
                              <div>
                                <span className="text-xs text-slate-500">Função</span>
                                <p className="text-sm font-medium">{role?.name || 'Carregando...'}</p>
                              </div>
                            </div>
                            
                            <div className="text-xs text-red-700">
                              Recusado por {resolver?.name || 'Sistema'} em {resolvedDate}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <X className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium">Nenhuma solicitação recusada</h3>
                        <p className="text-slate-500 mt-2">
                          {requestsLoading 
                            ? "Carregando solicitações..." 
                            : "Não há solicitações de troca recusadas para exibir."}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
