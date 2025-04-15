package models

import (
	"time"
)

// User representa um usuário no sistema
type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"password,omitempty"` // omitempty para não retornar em respostas JSON
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"createdAt"`
}

// UserRequest para criação/atualização de usuários
type UserRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Role     string `json:"role"`
}

// Team representa um time/ministério
type Team struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	LeaderID    int    `json:"leaderId"`
}

// TeamRequest para criação/atualização de times
type TeamRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	LeaderID    int    `json:"leaderId"`
}

// Role representa um papel específico dentro de um time
type Role struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	TeamID      int    `json:"teamId"`
	Description string `json:"description"`
}

// RoleRequest para criação/atualização de papéis
type RoleRequest struct {
	Name        string `json:"name" binding:"required"`
	TeamID      int    `json:"teamId" binding:"required"`
	Description string `json:"description"`
}

// Volunteer representa um voluntário associado a um time e papel
type Volunteer struct {
	ID        int  `json:"id"`
	UserID    int  `json:"userId"`
	TeamID    int  `json:"teamId"`
	RoleID    int  `json:"roleId"`
	IsTrainee bool `json:"isTrainee"`
}

// VolunteerRequest para criação/atualização de voluntários
type VolunteerRequest struct {
	UserID    int  `json:"userId" binding:"required"`
	TeamID    int  `json:"teamId" binding:"required"`
	RoleID    int  `json:"roleId" binding:"required"`
	IsTrainee bool `json:"isTrainee"`
}

// Event representa um evento (culto ou evento especial)
type Event struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Location    string    `json:"location"`
	EventDate   time.Time `json:"eventDate"`
	EventType   string    `json:"eventType"`
	Recurrent   bool      `json:"recurrent"`
	CreatedAt   time.Time `json:"createdAt"`
}

// EventRequest para criação/atualização de eventos
type EventRequest struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	Location    string    `json:"location" binding:"required"`
	EventDate   time.Time `json:"eventDate" binding:"required"`
	EventType   string    `json:"eventType" binding:"required"`
	Recurrent   bool      `json:"recurrent"`
}

// Schedule representa um agendamento de voluntário para um evento
type Schedule struct {
	ID               int       `json:"id"`
	EventID          int       `json:"eventId"`
	VolunteerID      int       `json:"volunteerId"`
	Status           string    `json:"status"`
	TraineePartnerID *int      `json:"traineePartnerId"`
	CreatedByID      int       `json:"createdById"`
	CreatedAt        time.Time `json:"createdAt"`
}

// ScheduleRequest para criação/atualização de agendamentos
type ScheduleRequest struct {
	EventID          int    `json:"eventId" binding:"required"`
	VolunteerID      int    `json:"volunteerId" binding:"required"`
	Status           string `json:"status"`
	TraineePartnerID *int   `json:"traineePartnerId"`
	CreatedByID      int    `json:"createdById" binding:"required"`
}

// AvailabilityRule representa uma regra de disponibilidade para um voluntário
type AvailabilityRule struct {
	ID          int        `json:"id"`
	VolunteerID int        `json:"volunteerId"`
	Description string     `json:"description"`
	DayOfWeek   *int       `json:"dayOfWeek"`
	StartTime   *string    `json:"startTime"`
	EndTime     *string    `json:"endTime"`
	StartDate   *time.Time `json:"startDate"`
	EndDate     *time.Time `json:"endDate"`
}

// AvailabilityRuleRequest para criação/atualização de regras de disponibilidade
type AvailabilityRuleRequest struct {
	VolunteerID int        `json:"volunteerId" binding:"required"`
	Description string     `json:"description" binding:"required"`
	DayOfWeek   *int       `json:"dayOfWeek"`
	StartTime   *string    `json:"startTime"`
	EndTime     *string    `json:"endTime"`
	StartDate   *time.Time `json:"startDate"`
	EndDate     *time.Time `json:"endDate"`
}

// SwapRequest representa uma solicitação de troca de horário entre voluntários
type SwapRequest struct {
	ID                  int       `json:"id"`
	RequestorScheduleID int       `json:"requestorScheduleId"`
	TargetScheduleID    *int      `json:"targetScheduleId"`
	TargetVolunteerID   *int      `json:"targetVolunteerId"`
	Reason              string    `json:"reason"`
	Status              string    `json:"status"`
	CreatedAt           time.Time `json:"createdAt"`
}

// SwapRequestRequest para criação/atualização de solicitações de troca
type SwapRequestRequest struct {
	RequestorScheduleID int    `json:"requestorScheduleId" binding:"required"`
	TargetScheduleID    *int   `json:"targetScheduleId"`
	TargetVolunteerID   *int   `json:"targetVolunteerId"`
	Reason              string `json:"reason"`
	Status              string `json:"status"`
}

// Notification representa uma notificação para um usuário
type Notification struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"`
	Read      bool      `json:"read"`
	CreatedAt time.Time `json:"createdAt"`
}

// NotificationRequest para criação/atualização de notificações
type NotificationRequest struct {
	UserID  int    `json:"userId" binding:"required"`
	Title   string `json:"title" binding:"required"`
	Message string `json:"message" binding:"required"`
	Type    string `json:"type" binding:"required"`
}

// LoginRequest para autenticação de usuários
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse para resposta de autenticação
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

// DashboardStats para estatísticas do dashboard
type DashboardStats struct {
	TotalEvents          int         `json:"totalEvents"`
	TotalVolunteers      int         `json:"totalVolunteers"`
	TotalTeams           int         `json:"totalTeams"`
	UpcomingEventsCount  int         `json:"upcomingEventsCount"`
	PendingSwapRequests  int         `json:"pendingSwapRequests"`
	UnreadNotifications  int         `json:"unreadNotifications"`
	SchedulingConflicts  int         `json:"schedulingConflicts"`
	VolunteersByTeam     []TeamStat  `json:"volunteersByTeam"`
	EventsByMonth        []EventStat `json:"eventsByMonth"`
	RecentNotifications  []Notification `json:"recentNotifications"`
}

// TeamStat representa estatísticas por time
type TeamStat struct {
	TeamName string `json:"teamName"`
	Count    int    `json:"count"`
}

// EventStat representa estatísticas de eventos por mês
type EventStat struct {
	Month string `json:"month"`
	Count int    `json:"count"`
}

// ApiResponse representa uma resposta padrão da API
type ApiResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}