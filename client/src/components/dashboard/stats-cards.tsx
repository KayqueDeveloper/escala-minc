import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Calendar, Users, UserPlus } from "lucide-react";
import { DashboardStat } from "@/components/ui/dashboard-stat";

export function StatsCards() {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: conflicts, isLoading: isLoadingConflicts } = useQuery({
    queryKey: ['/api/conflicts'],
  });

  return (
    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardStat 
        title="Voluntários"
        value={isLoadingStats ? "..." : (stats?.volunteerCount || 0)}
        icon={Users}
        footerLabel="Ver todos"
        footerHref="/volunteers"
      />
      
      <DashboardStat 
        title="Times"
        value={isLoadingStats ? "..." : (stats?.teamCount || 0)}
        icon={UserPlus}
        footerLabel="Ver todos"
        footerHref="/teams"
      />
      
      <DashboardStat 
        title="Cultos este mês"
        value={isLoadingStats ? "..." : (stats?.monthlyServiceCount || 0)}
        icon={Calendar}
        footerLabel="Ver calendário"
        footerHref="/events"
      />
      
      <DashboardStat 
        title="Conflitos de Escalas"
        value={isLoadingConflicts ? "..." : (conflicts?.length || 0)}
        icon={AlertTriangle}
        iconClassName="text-amber-500"
        footerLabel="Resolver"
        footerHref="/schedules?filter=conflicts"
      />
    </div>
  );
}
