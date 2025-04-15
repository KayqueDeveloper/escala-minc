import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils/date-utils";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function UpcomingServices() {
  const { data: upcomingServices, isLoading } = useQuery({
    queryKey: ['/api/events/upcoming'],
  });

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      complete: "bg-green-100 text-green-800",
      warning: "bg-amber-100 text-amber-800", 
      incomplete: "bg-red-100 text-red-800"
    };
    
    const statusLabels = {
      complete: "Completa",
      warning: "Atenção",
      incomplete: "Incompleta"
    };
    
    const className = statusClasses[status as keyof typeof statusClasses] || statusClasses.incomplete;
    const label = statusLabels[status as keyof typeof statusLabels] || statusLabels.incomplete;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 font-heading">Próximos cultos</h2>
        <div className="mt-4 h-64 bg-white shadow rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 font-heading">Próximos cultos</h2>
      <Card className="mt-4">
        <div className="p-4 flex flex-col space-y-3">
          {upcomingServices?.map((service) => (
            <div 
              key={service.id} 
              className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border-b border-gray-200 last:border-b-0"
            >
              <div className="md:col-span-1">
                <div className="text-sm text-gray-500">
                  {formatDate(service.eventDate, 'EEEE')}
                </div>
                <div className="text-lg font-medium">
                  {formatDate(service.eventDate, 'dd/MMM')}
                </div>
                <div className="text-sm font-semibold text-primary-600">
                  {formatDate(service.eventDate, 'HH:mm')}
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="font-medium">{service.title}</h3>
                <div className="text-sm text-gray-500">{service.location}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {service.teamCount} times envolvidos
                </div>
              </div>
              
              <div className="md:col-span-2">
                <AvatarGroup 
                  avatars={service.volunteers.map(v => ({
                    src: v.avatarUrl,
                    alt: v.name,
                    fallback: v.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                  }))}
                  max={4}
                />
                <div className="mt-2">
                  {getStatusBadge(service.status)}
                </div>
              </div>
              
              <div className="md:col-span-1 flex md:justify-end items-start">
                <Button 
                  variant={service.status === 'complete' ? 'outline' : 'outline'} 
                  size="sm"
                  className={service.status !== 'complete' ? "border-primary-600 text-primary-600 hover:bg-primary-50" : ""}
                >
                  {service.status === 'complete' ? 'Ver escala' : 'Completar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <a href="/events" className="text-sm font-medium text-primary-600 hover:text-primary-900">
            Ver todos os cultos
          </a>
        </div>
      </Card>
    </div>
  );
}
