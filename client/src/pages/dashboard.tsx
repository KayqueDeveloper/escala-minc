import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import QuickActions from "@/components/dashboard/QuickActions";
import Calendar from "@/components/dashboard/Calendar";
import PendingRequests from "@/components/dashboard/PendingRequests";
import TeamStats from "@/components/dashboard/TeamStats";
import ScheduleTable from "@/components/dashboard/ScheduleTable";

export default function Dashboard() {
  useEffect(() => {
    // Set document title
    document.title = "Dashboard - EscalaFácil";
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <Header title="Dashboard" subtitle="Gerenciamento de Escalas" />
          
          <QuickActions />
          
          <Calendar />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <PendingRequests />
            <TeamStats />
          </div>
          
          <ScheduleTable />
        </div>
      </main>
    </div>
  );
}
