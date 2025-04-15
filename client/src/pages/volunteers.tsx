import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import VolunteerForm from '@/components/volunteers/volunteer-form';
import AvailabilityForm from '@/components/volunteers/availability-form';
import { Badge } from '@/components/ui/badge';

const Volunteers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [isVolunteerFormOpen, setIsVolunteerFormOpen] = useState(false);
  const [isAvailabilityFormOpen, setIsAvailabilityFormOpen] = useState(false);

  // Fetch volunteers data
  const { data: volunteers, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  // Filter volunteers based on search query
  const filteredVolunteers = volunteers?.filter((volunteer: any) => 
    volunteer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle new volunteer button click
  const handleNewVolunteer = () => {
    setSelectedVolunteer(null);
    setIsVolunteerFormOpen(true);
  };

  // Handle edit volunteer
  const handleEditVolunteer = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setIsVolunteerFormOpen(true);
  };

  // Handle volunteer availability
  const handleVolunteerAvailability = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setIsAvailabilityFormOpen(true);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-neutral-dark">Voluntários</h1>
          <p className="text-neutral-medium">Gerencie os voluntários e suas disponibilidades</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={handleNewVolunteer}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            <span className="material-icons mr-1 text-sm">person_add</span>
            Novo Voluntário
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-dark mb-1">Buscar Voluntário</label>
            <div className="relative">
              <span className="absolute left-2.5 top-2.5 text-neutral-medium material-icons text-lg">search</span>
              <Input
                className="pl-9"
                placeholder="Nome, equipe ou função..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-neutral-dark mb-1">Filtrar por Time</label>
            <select className="w-full border border-neutral-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="all">Todos os times</option>
              <option value="1">Equipe de Transmissão</option>
              <option value="2">Recepção</option>
              <option value="3">Kids</option>
            </select>
          </div>
        </div>
      </div>

      {/* Volunteers List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-light">
              <thead>
                <tr className="bg-neutral-lightest">
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Time(s)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Função</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-dark uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-light">
                {isLoading ? (
                  Array(5).fill(0).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-neutral-100"></div>
                          <div className="ml-3">
                            <div className="h-4 w-32 bg-neutral-100 rounded"></div>
                            <div className="h-3 w-24 bg-neutral-100 rounded mt-1"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-4 w-24 bg-neutral-100 rounded"></div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-4 w-20 bg-neutral-100 rounded"></div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-5 w-16 bg-neutral-100 rounded-full"></div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-4 w-24 bg-neutral-100 rounded"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredVolunteers?.map((volunteer: any) => (
                    <tr key={volunteer.id} className="hover:bg-neutral-lightest transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={volunteer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(volunteer.name)}&background=3f51b5&color=fff`} 
                            alt={volunteer.name} 
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-neutral-dark">{volunteer.name}</div>
                            <div className="text-xs text-neutral-medium">{volunteer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          <Badge variant="outline" className="bg-primary-light/10">
                            Transmissão
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-neutral-dark">Coordenador</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          Ativo
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditVolunteer(volunteer)}
                          >
                            <span className="material-icons text-primary text-base">edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleVolunteerAvailability(volunteer)}
                          >
                            <span className="material-icons text-blue-500 text-base">event_available</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Volunteer Form Dialog */}
      <Dialog open={isVolunteerFormOpen} onOpenChange={setIsVolunteerFormOpen}>
        <DialogContent className="max-w-2xl">
          <VolunteerForm 
            volunteer={selectedVolunteer} 
            onClose={() => setIsVolunteerFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Availability Form Dialog */}
      <Dialog open={isAvailabilityFormOpen} onOpenChange={setIsAvailabilityFormOpen}>
        <DialogContent className="max-w-2xl">
          <AvailabilityForm 
            volunteer={selectedVolunteer} 
            onClose={() => setIsAvailabilityFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Volunteers;
