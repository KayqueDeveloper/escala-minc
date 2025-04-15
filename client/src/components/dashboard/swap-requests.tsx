import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export function SwapRequests() {
  const { data: swapRequests, isLoading } = useQuery({
    queryKey: ['/api/swap-requests'],
  });

  const approveMutation = useMutation({
    mutationFn: async (swapRequestId: number) => {
      return apiRequest('POST', `/api/swap-requests/${swapRequestId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (swapRequestId: number) => {
      return apiRequest('POST', `/api/swap-requests/${swapRequestId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/swap-requests'] });
    }
  });

  if (isLoading) {
    return (
      <div className="mt-8 mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 font-heading">Solicitações de Troca</h2>
        </div>
        <div className="mt-4 h-48 bg-white shadow rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!swapRequests || swapRequests.length === 0) {
    return (
      <div className="mt-8 mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 font-heading">Solicitações de Troca</h2>
        </div>
        <Card className="mt-4">
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Não há solicitações de troca no momento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const newRequestsCount = swapRequests.filter(req => req.isNew).length;

  return (
    <div className="mt-8 mb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 font-heading">Solicitações de Troca</h2>
        {newRequestsCount > 0 && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {newRequestsCount} {newRequestsCount === 1 ? 'nova' : 'novas'}
          </span>
        )}
      </div>
      <Card className="mt-4 overflow-hidden">
        <ul role="list" className="divide-y divide-gray-200">
          {swapRequests.slice(0, 2).map((request) => (
            <li key={request.id}>
              <div className="px-4 py-4 sm:px-6">
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
                  {request.isNew && (
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        Novo
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex">
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>{request.swapDetails}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Motivo: {request.reason}</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejectMutation.mutate(request.id)}
                    disabled={rejectMutation.isPending}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => approveMutation.mutate(request.id)}
                    disabled={approveMutation.isPending}
                  >
                    Aprovar
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <a href="/notifications" className="text-sm font-medium text-primary-600 hover:text-primary-900">
            Ver todas as solicitações
          </a>
        </div>
      </Card>
    </div>
  );
}
