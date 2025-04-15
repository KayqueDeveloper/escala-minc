import { useQuery } from '@tanstack/react-query';
import { SwapRequest, ScheduleDetail, Schedule, User, Role } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PendingRequests() {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Fetch pending swap requests
  const { data: swapRequests, isLoading } = useQuery<SwapRequest[]>({
    queryKey: ['/api/swap-requests', { status: 'pending' }],
  });

  // Helper function to get request details (schedule, users, etc.)
  const useRequestDetails = (requestId: number) => {
    const request = swapRequests?.find(req => req.id === requestId);
    
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
    
    // Fetch requester user details
    const { data: requester } = useQuery<User>({
      queryKey: ['/api/users', request?.requesterId],
      enabled: !!request?.requesterId,
    });
    
    // Fetch role details
    const { data: role } = useQuery<Role>({
      queryKey: ['/api/roles', scheduleDetail?.roleId],
      enabled: !!scheduleDetail?.roleId,
    });
    
    return { request, scheduleDetail, schedule, requester, role };
  };

  // Handle request approval
  const handleApprove = async (requestId: number) => {
    try {
      setProcessingId(requestId);
      await apiRequest('PUT', `/api/swap-requests/${requestId}`, {
        status: 'approved',
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

  if (isLoading) {
    return (
      <div className="lg:col-span-2">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Solicitações Pendentes</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!swapRequests || swapRequests.length === 0) {
    return (
      <div className="lg:col-span-2">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Solicitações Pendentes</h2>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <p className="text-slate-500">Não há solicitações pendentes no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Solicitações Pendentes</h2>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Trocas e Substituições</h3>
            <a href="/requests" className="text-sm text-primary hover:text-primary-dark">Ver todas</a>
          </div>
        </div>
        <div className="divide-y">
          {swapRequests.slice(0, 3).map(request => {
            // Use our helper hook to get all needed details for this request
            const { scheduleDetail, schedule, requester, role } = useRequestDetails(request.id);
            
            // Format the time ago string
            const timeAgo = request.createdAt ? 
              formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ptBR }) :
              '';
            
            // Get date and service/event name
            const dateStr = schedule?.date ? 
              format(new Date(schedule.date), 'dd/MM') : 
              '--/--';
            
            return (
              <div key={request.id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full mr-3 bg-slate-200 flex items-center justify-center text-lg font-bold">
                    {requester?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{requester?.name || 'Carregando...'}</p>
                      <span className="text-xs text-slate-500">{timeAgo}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Solicitou {request.replacementId ? 'troca' : 'substituição'} no <span className="font-medium">Culto</span> do dia <span className="font-medium">{dateStr}</span> da função <span className="font-medium">{role?.name || 'Carregando...'}</span>.
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={!!processingId}
                      >
                        {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        disabled={!!processingId}
                      >
                        Recusar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
