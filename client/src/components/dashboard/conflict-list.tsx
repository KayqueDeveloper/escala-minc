import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/date-utils";

export function ConflictList() {
  const { data: conflicts, isLoading } = useQuery({
    queryKey: ['/api/conflicts'],
  });

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 font-heading">Conflitos de Escala</h2>
        <div className="mt-4 h-60 bg-white shadow rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!conflicts || conflicts.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 font-heading">Conflitos de Escala</h2>
        <Card className="mt-4">
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">Não há conflitos de escala no momento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 font-heading">Conflitos de Escala</h2>
      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voluntário
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Culto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Times
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {conflicts.map((conflict) => (
                <tr key={conflict.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <Avatar>
                          <AvatarImage src={conflict.volunteer.avatarUrl} alt={conflict.volunteer.name} />
                          <AvatarFallback>
                            {conflict.volunteer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{conflict.volunteer.name}</div>
                        <div className="text-sm text-gray-500">{conflict.volunteer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(conflict.eventDate, 'dd/MMM - HH:mm')}
                    </div>
                    <div className="text-sm text-gray-500">{conflict.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {conflict.assignments.map((assignment, index) => (
                        <span 
                          key={index}
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assignment.colorClass}`}
                        >
                          {assignment.teamName} ({assignment.roleName})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Conflito
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" className="text-primary-600 hover:text-primary-900 mr-2">
                      Mudar Time
                    </Button>
                    <Button variant="ghost" className="text-primary-600 hover:text-primary-900">
                      Resolver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
