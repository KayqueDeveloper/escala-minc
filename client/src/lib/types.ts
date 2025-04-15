// Event type definitions
export interface EventBasic {
  id: number;
  title: string;
  description?: string;
  location: string;
  eventDate: string; // ISO date string
  eventType: 'regular_service' | 'special_event' | 'conference';
  recurrent: boolean;
}

export interface EventWithTeams extends EventBasic {
  teamIds: number[];
  teamCount: number;
}

export interface EventWithVolunteers extends EventBasic {
  teamCount: number;
  volunteers: Array<{
    id: number;
    name: string;
    avatarUrl?: string;
  }>;
  status: 'complete' | 'warning' | 'incomplete';
}

// Schedule type definitions
export interface Schedule {
  id: number;
  eventId: number;
  title: string;
  description?: string;
  location: string;
  eventDate: string; // ISO date string
  teamCount: number;
  volunteers: Array<{
    id: number;
    name: string;
    avatarUrl?: string;
  }>;
  status: 'complete' | 'warning' | 'incomplete';
  hasConflicts: boolean;
}

// Team type definitions
export interface TeamBasic {
  id: number;
  name: string;
  description?: string;
  leaderId?: number;
}

export interface TeamWithRoles extends TeamBasic {
  leader?: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  roles: Array<{
    id: number;
    name: string;
    description?: string;
    volunteerCount: number;
  }>;
  volunteerCount: number;
}

// Volunteer type definitions
export interface VolunteerBasic {
  id: number;
  userId: number;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface VolunteerWithTeams extends VolunteerBasic {
  teams: Array<{
    id: number;
    name: string;
    role: string;
    roleId: number;
  }>;
  isTrainee: boolean;
  hasConflicts: boolean;
}

// Role type definitions
export interface Role {
  id: number;
  name: string;
  teamId: number;
  description?: string;
}

// Conflict type definitions
export interface Conflict {
  id: number;
  volunteer: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  eventDate: string;
  location: string;
  assignments: Array<{
    teamId: number;
    teamName: string;
    roleId: number;
    roleName: string;
    colorClass: string;
  }>;
}

// Swap request type definitions
export interface SwapRequest {
  id: number;
  requestor: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  teamName: string;
  roleName: string;
  swapDetails: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  isNew: boolean;
}

// Notification type definitions
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'conflict' | 'swap_request' | 'reminder';
  read: boolean;
  createdAt: string;
}

// Dashboard stats type definitions
export interface DashboardStats {
  volunteerCount: number;
  teamCount: number;
  monthlyServiceCount: number;
  conflictCount: number;
}
