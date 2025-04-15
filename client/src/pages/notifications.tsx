import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';

const Notifications: React.FC = () => {
  const { toast } = useToast();
  const [currentUser] = useState(1); // Normally would come from auth context

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: [`/api/users/${currentUser}/notifications`],
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser}/notifications`] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida",
        variant: "destructive",
      });
    }
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest('DELETE', `/api/notifications/${notificationId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser}/notifications`] });
      toast({
        title: "Notificação excluída",
        description: "A notificação foi removida com sucesso",
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a notificação",
        variant: "destructive",
      });
    }
  });

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Get all unread notifications
      const unreadNotifications = notifications.filter((notification: any) => !notification.isRead);
      
      // Mark each as read
      await Promise.all(
        unreadNotifications.map((notification: any) => 
          markAsReadMutation.mutateAsync(notification.id)
        )
      );
      
      toast({
        title: "Todas as notificações marcadas como lidas",
        description: "Todas as notificações foram marcadas como lidas com sucesso",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas",
        variant: "destructive",
      });
    }
  };

  // Format notification time
  const getNotificationTimeString = (createdAt: string) => {
    const now = new Date();
    const notifDate = new Date(createdAt);
    const diffMillis = now.getTime() - notifDate.getTime();
    const diffMinutes = Math.floor(diffMillis / (1000 * 60));
    const diffHours = Math.floor(diffMillis / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMillis / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `há ${diffMinutes} minutos`;
    } else if (diffHours < 24) {
      return `há ${diffHours} horas`;
    } else {
      return `há ${diffDays} dias`;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'swap_request':
        return 'swap_horiz';
      case 'swap_request_update':
        return 'update';
      case 'schedule_published':
        return 'event_available';
      case 'schedule_updated':
        return 'event_note';
      default:
        return 'notifications';
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-neutral-dark">Notificações</h1>
          <p className="text-neutral-medium">Acompanhe as atualizações e solicitações</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            variant="outline"
            onClick={markAllAsRead}
            disabled={isLoading || !notifications?.some((n: any) => !n.isRead)}
          >
            <span className="material-icons mr-1 text-sm">done_all</span>
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-light">
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <div key={index} className="p-4 animate-pulse">
                  <div className="flex">
                    <div className="rounded-full bg-neutral-100 h-10 w-10 flex items-center justify-center mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-neutral-100 rounded mb-2"></div>
                      <div className="h-3 w-1/2 bg-neutral-100 rounded mb-2"></div>
                      <div className="h-3 w-1/4 bg-neutral-100 rounded"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : notifications?.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <span className="material-icons text-5xl text-neutral-medium mb-2">notifications_off</span>
                <h3 className="text-lg font-medium text-neutral-dark mb-1">Sem notificações</h3>
                <p className="text-neutral-medium">Você não possui notificações no momento</p>
              </div>
            ) : (
              notifications?.map((notification: any) => (
                <div 
                  key={notification.id} 
                  className={`p-4 flex hover:bg-neutral-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className={`rounded-full h-10 w-10 flex items-center justify-center mr-3 ${!notification.isRead ? 'bg-primary text-white' : 'bg-neutral-100'}`}>
                    <span className="material-icons text-base">
                      {getNotificationIcon(notification.type)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-primary' : 'text-neutral-dark'}`}>
                        {notification.title}
                      </h3>
                      <div className="flex space-x-1">
                        {!notification.isRead && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                          >
                            <span className="material-icons text-sm text-neutral-medium">check</span>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        >
                          <span className="material-icons text-sm text-neutral-medium">delete</span>
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-medium mt-1">{notification.message}</p>
                    <p className="text-xs text-neutral-medium mt-2">
                      {getNotificationTimeString(notification.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
