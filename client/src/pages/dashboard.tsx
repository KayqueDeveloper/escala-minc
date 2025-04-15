import { Sidebar } from "@/components/layout/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UpcomingServices } from "@/components/dashboard/upcoming-services";
import { ConflictList } from "@/components/dashboard/conflict-list";
import { SwapRequests } from "@/components/dashboard/swap-requests";

export default function Dashboard() {
  return (
    <div className="min-h-screen flex overflow-hidden bg-gray-50 font-sans">
      <Sidebar />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 font-heading">Dashboard</h1>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <StatsCards />
              <UpcomingServices />
              <ConflictList />
              <SwapRequests />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
