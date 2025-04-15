import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SwapRequestItem from '@/components/schedules/swap-request-item';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const SwapRequests: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch swap requests
  const { data: swapRequests, isLoading } = useQuery({
    queryKey: ['/api/swap-requests'],
  });

  // Group requests by status
  const pendingRequests = swapRequests?.filter(req => req.status === 'pending') || [];
  const approvedRequests = swapRequests?.filter(req => req.status === 'approved') || [];
  const rejectedRequests = swapRequests?.filter(req => req.status === 'rejected') || [];

  // Handle request approval
  const handleApprove = async (requestId: number) => {
    try {
      await apiRequest('PATCH', `/api/swap-requests/${requestId}`, {
        status: 'approved',
        resolvedBy: 1 // Using user ID 1 as default for demo
      });
      
      toast({
        title: "Solicitação aprovada",
        description: "A troca foi aprovada com sucesso",
        variant: "default",
      });
      
      // Invalidate cache to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a solicitação",
        variant: "destructive",
      });
    }
  };

  // Handle request rejection
  const handleReject = async (requestId: number) => {
    try {
      await apiRequest('PATCH', `/api/swap-requests/${requestId}`, {
        status: 'rejected',
        resolvedBy: 1 // Using user ID 1 as default for demo
      });
      
      toast({
        title: "Solicitação rejeitada",
        description: "A troca foi rejeitada",
        variant: "default",
      });
      
      // Invalidate cache to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a solicitação",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-neutral-dark">Solicitações de Troca</h1>
          <p className="text-neutral-medium">Gerencie as solicitações de troca de escala</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button className="bg-primary text-white hover:bg-primary-dark">
            <span className="material-icons mr-1 text-sm">swap_horiz</span>
            Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Swap Requests Tabs */}
      <Card>
        <Tabs defaultValue="pending" onValueChange={setActiveTab} value={activeTab}>
          <div className="p-4 border-b border-neutral-light flex items-center justify-between">
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="pending" className="flex items-center">
                Pendentes
                {pendingRequests.length > 0 && (
                  <span className="ml-2 bg-secondary text-white text-xs px-2 py-1 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Aprovadas</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
            </TabsList>
          </div>
          <CardContent className="p-0">
            <TabsContent value="pending">
              <div className="divide-y divide-neutral-light">
                {isLoading ? (
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="p-4 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 w-32 bg-neutral-100 rounded"></div>
                        <div className="h-5 w-16 bg-yellow-100 rounded-full"></div>
                      </div>
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-neutral-100 mr-3"></div>
                        <div>
                          <div className="h-4 w-32 bg-neutral-100 rounded mb-1"></div>
                          <div className="h-3 w-24 bg-neutral-100 rounded"></div>
                        </div>
                      </div>
                      <div className="bg-neutral-lightest rounded p-3 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-3 w-24 bg-neutral-100 rounded"></div>
                          <div className="h-3 w-24 bg-neutral-100 rounded"></div>
                        </div>
                        <div className="h-4 w-48 bg-neutral-100 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : pendingRequests.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <span className="material-icons text-5xl text-neutral-medium mb-2">check_circle</span>
                    <h3 className="text-lg font-medium text-neutral-dark mb-1">Sem solicitações pendentes</h3>
                    <p className="text-neutral-medium">Todas as solicitações foram processadas</p>
                  </div>
                ) : (
                  pendingRequests.map(request => (
                    <SwapRequestItem
                      key={request.id}
                      request={request}
                      onApprove={() => handleApprove(request.id)}
                      onReject={() => handleReject(request.id)}
                    />
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="approved">
              <div className="divide-y divide-neutral-light">
                {approvedRequests.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <span className="material-icons text-5xl text-neutral-medium mb-2">info</span>
                    <h3 className="text-lg font-medium text-neutral-dark mb-1">Sem solicitações aprovadas</h3>
                    <p className="text-neutral-medium">Nenhuma solicitação foi aprovada ainda</p>
                  </div>
                ) : (
                  approvedRequests.map(request => (
                    <SwapRequestItem
                      key={request.id}
                      request={request}
                      readOnly
                    />
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="rejected">
              <div className="divide-y divide-neutral-light">
                {rejectedRequests.length === 0 ? (
                  <div className="py-12 px-4 text-center">
                    <span className="material-icons text-5xl text-neutral-medium mb-2">block</span>
                    <h3 className="text-lg font-medium text-neutral-dark mb-1">Sem solicitações rejeitadas</h3>
                    <p className="text-neutral-medium">Nenhuma solicitação foi rejeitada</p>
                  </div>
                ) : (
                  rejectedRequests.map(request => (
                    <SwapRequestItem
                      key={request.id}
                      request={request}
                      readOnly
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default SwapRequests;
