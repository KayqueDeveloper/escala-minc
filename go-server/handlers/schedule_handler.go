package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"volunteer-scheduler/db"
	"volunteer-scheduler/models"
)

// GetSchedules retorna todos os agendamentos
func GetSchedules(c *gin.Context) {
	rows, err := db.DB.Query(context.Background(), 
		`SELECT s.id, s.event_id, s.volunteer_id, s.status, s.trainee_partner_id, s.created_by_id, s.created_at
		 FROM schedules s
		 ORDER BY s.created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar agendamentos",
		})
		return
	}
	defer rows.Close()

	var schedules []models.Schedule
	for rows.Next() {
		var schedule models.Schedule
		var traineePartnerID *int
		if err := rows.Scan(&schedule.ID, &schedule.EventID, &schedule.VolunteerID, 
			&schedule.Status, &traineePartnerID, &schedule.CreatedByID, &schedule.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar agendamentos",
			})
			return
		}
		
		schedule.TraineePartnerID = traineePartnerID
		schedules = append(schedules, schedule)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    schedules,
	})
}

// GetSchedule retorna um agendamento específico pelo ID
func GetSchedule(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	var schedule models.Schedule
	var traineePartnerID *int
	err = db.DB.QueryRow(context.Background(),
		`SELECT id, event_id, volunteer_id, status, trainee_partner_id, created_by_id, created_at
		 FROM schedules 
		 WHERE id = $1`, id).
		Scan(&schedule.ID, &schedule.EventID, &schedule.VolunteerID, 
			&schedule.Status, &traineePartnerID, &schedule.CreatedByID, &schedule.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Agendamento não encontrado",
		})
		return
	}
	
	schedule.TraineePartnerID = traineePartnerID

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    schedule,
	})
}

// CreateSchedule cria um novo agendamento
func CreateSchedule(c *gin.Context) {
	var scheduleRequest models.ScheduleRequest

	if err := c.ShouldBindJSON(&scheduleRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	// Verificar se o evento existe
	var eventExists bool
	err := db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM events WHERE id = $1)", 
		scheduleRequest.EventID).Scan(&eventExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar evento",
		})
		return
	}

	if !eventExists {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Evento não encontrado",
		})
		return
	}

	// Verificar se o voluntário existe
	var volunteerExists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM volunteers WHERE id = $1)", 
		scheduleRequest.VolunteerID).Scan(&volunteerExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar voluntário",
		})
		return
	}

	if !volunteerExists {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Voluntário não encontrado",
		})
		return
	}

	// Verificar se o agendamento já existe para esse evento e voluntário
	var scheduleExists bool
	err = db.DB.QueryRow(context.Background(), 
		"SELECT EXISTS(SELECT 1 FROM schedules WHERE event_id = $1 AND volunteer_id = $2)", 
		scheduleRequest.EventID, scheduleRequest.VolunteerID).Scan(&scheduleExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar agendamento existente",
		})
		return
	}

	if scheduleExists {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Este voluntário já está agendado para este evento",
		})
		return
	}

	// Verificar conflitos de horário
	hasConflict, err := checkSchedulingConflict(scheduleRequest.EventID, scheduleRequest.VolunteerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar conflitos de horário",
		})
		return
	}

	if hasConflict {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Conflito de horário: o voluntário já está agendado para outro evento no mesmo horário",
		})
		return
	}

	// Definir status padrão se não fornecido
	if scheduleRequest.Status == "" {
		scheduleRequest.Status = "confirmed"
	}

	// Criar agendamento
	var schedule models.Schedule
	err = db.DB.QueryRow(context.Background(),
		`INSERT INTO schedules (event_id, volunteer_id, status, trainee_partner_id, created_by_id) 
		 VALUES ($1, $2, $3, $4, $5) 
		 RETURNING id, event_id, volunteer_id, status, trainee_partner_id, created_by_id, created_at`,
		scheduleRequest.EventID, scheduleRequest.VolunteerID, scheduleRequest.Status, 
		scheduleRequest.TraineePartnerID, scheduleRequest.CreatedByID).
		Scan(&schedule.ID, &schedule.EventID, &schedule.VolunteerID, &schedule.Status, 
			&schedule.TraineePartnerID, &schedule.CreatedByID, &schedule.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao criar agendamento",
		})
		return
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success: true,
		Message: "Agendamento criado com sucesso",
		Data:    schedule,
	})
}

// UpdateSchedule atualiza um agendamento existente
func UpdateSchedule(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	var scheduleRequest models.ScheduleRequest
	if err := c.ShouldBindJSON(&scheduleRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	// Verificar se o agendamento existe
	var exists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM schedules WHERE id = $1)", id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar agendamento",
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Agendamento não encontrado",
		})
		return
	}

	// Definir status padrão se não fornecido
	if scheduleRequest.Status == "" {
		scheduleRequest.Status = "confirmed"
	}

	// Atualizar agendamento
	var schedule models.Schedule
	err = db.DB.QueryRow(context.Background(),
		`UPDATE schedules 
		 SET event_id = $1, volunteer_id = $2, status = $3, trainee_partner_id = $4, created_by_id = $5 
		 WHERE id = $6 
		 RETURNING id, event_id, volunteer_id, status, trainee_partner_id, created_by_id, created_at`,
		scheduleRequest.EventID, scheduleRequest.VolunteerID, scheduleRequest.Status, 
		scheduleRequest.TraineePartnerID, scheduleRequest.CreatedByID, id).
		Scan(&schedule.ID, &schedule.EventID, &schedule.VolunteerID, &schedule.Status, 
			&schedule.TraineePartnerID, &schedule.CreatedByID, &schedule.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao atualizar agendamento",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Agendamento atualizado com sucesso",
		Data:    schedule,
	})
}

// DeleteSchedule remove um agendamento
func DeleteSchedule(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	// Verificar se o agendamento existe
	var exists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM schedules WHERE id = $1)", id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar agendamento",
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Agendamento não encontrado",
		})
		return
	}

	// Verificar dependências (swap_requests)
	var hasSwapRequests bool
	err = db.DB.QueryRow(context.Background(), 
		"SELECT EXISTS(SELECT 1 FROM swap_requests WHERE requestor_schedule_id = $1 OR target_schedule_id = $1)", id).Scan(&hasSwapRequests)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar solicitações de troca",
		})
		return
	}

	if hasSwapRequests {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Não é possível excluir agendamento com solicitações de troca associadas",
		})
		return
	}

	// Excluir agendamento
	_, err = db.DB.Exec(context.Background(), "DELETE FROM schedules WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao excluir agendamento",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Agendamento excluído com sucesso",
	})
}

// GetSchedulesByEvent retorna todos os agendamentos de um evento específico
func GetSchedulesByEvent(c *gin.Context) {
	eventID, err := strconv.Atoi(c.Param("eventId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID de evento inválido",
		})
		return
	}

	// Verificar se o evento existe
	var eventExists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM events WHERE id = $1)", eventID).Scan(&eventExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar evento",
		})
		return
	}

	if !eventExists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Evento não encontrado",
		})
		return
	}

	// Buscar agendamentos com informações detalhadas
	rows, err := db.DB.Query(context.Background(), 
		`SELECT s.id, s.event_id, s.volunteer_id, s.status, s.trainee_partner_id, s.created_by_id, s.created_at,
		        v.user_id, u.name as user_name, t.id as team_id, t.name as team_name, r.name as role_name,
		        v.is_trainee
		 FROM schedules s
		 JOIN volunteers v ON s.volunteer_id = v.id
		 JOIN users u ON v.user_id = u.id
		 JOIN teams t ON v.team_id = t.id
		 JOIN roles r ON v.role_id = r.id
		 WHERE s.event_id = $1
		 ORDER BY t.name, r.name`, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar agendamentos do evento",
		})
		return
	}
	defer rows.Close()

	type ScheduleDetail struct {
		ID               int       `json:"id"`
		EventID          int       `json:"eventId"`
		VolunteerID      int       `json:"volunteerId"`
		Status           string    `json:"status"`
		TraineePartnerID *int      `json:"traineePartnerId"`
		CreatedByID      int       `json:"createdById"`
		CreatedAt        time.Time `json:"createdAt"`
		UserID           int       `json:"userId"`
		UserName         string    `json:"userName"`
		TeamID           int       `json:"teamId"`
		TeamName         string    `json:"teamName"`
		RoleName         string    `json:"roleName"`
		IsTrainee        bool      `json:"isTrainee"`
	}

	var scheduleDetails []ScheduleDetail
	for rows.Next() {
		var sd ScheduleDetail
		var traineePartnerID *int
		if err := rows.Scan(&sd.ID, &sd.EventID, &sd.VolunteerID, &sd.Status, &traineePartnerID, 
			&sd.CreatedByID, &sd.CreatedAt, &sd.UserID, &sd.UserName, &sd.TeamID, &sd.TeamName, 
			&sd.RoleName, &sd.IsTrainee); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar agendamentos",
			})
			return
		}
		
		sd.TraineePartnerID = traineePartnerID
		scheduleDetails = append(scheduleDetails, sd)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    scheduleDetails,
	})
}

// GetSchedulesByVolunteer retorna todos os agendamentos de um voluntário específico
func GetSchedulesByVolunteer(c *gin.Context) {
	volunteerID, err := strconv.Atoi(c.Param("volunteerId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID de voluntário inválido",
		})
		return
	}

	// Verificar se o voluntário existe
	var volunteerExists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM volunteers WHERE id = $1)", volunteerID).Scan(&volunteerExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar voluntário",
		})
		return
	}

	if !volunteerExists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Voluntário não encontrado",
		})
		return
	}

	// Buscar agendamentos com informações do evento
	rows, err := db.DB.Query(context.Background(), 
		`SELECT s.id, s.event_id, s.volunteer_id, s.status, s.trainee_partner_id, s.created_by_id, s.created_at,
		        e.title as event_title, e.event_date, e.location, e.event_type
		 FROM schedules s
		 JOIN events e ON s.event_id = e.id
		 WHERE s.volunteer_id = $1
		 ORDER BY e.event_date DESC`, volunteerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar agendamentos do voluntário",
		})
		return
	}
	defer rows.Close()

	type ScheduleWithEvent struct {
		ID               int       `json:"id"`
		EventID          int       `json:"eventId"`
		VolunteerID      int       `json:"volunteerId"`
		Status           string    `json:"status"`
		TraineePartnerID *int      `json:"traineePartnerId"`
		CreatedByID      int       `json:"createdById"`
		CreatedAt        time.Time `json:"createdAt"`
		EventTitle       string    `json:"eventTitle"`
		EventDate        time.Time `json:"eventDate"`
		Location         string    `json:"location"`
		EventType        string    `json:"eventType"`
	}

	var schedulesWithEvents []ScheduleWithEvent
	for rows.Next() {
		var swe ScheduleWithEvent
		var traineePartnerID *int
		if err := rows.Scan(&swe.ID, &swe.EventID, &swe.VolunteerID, &swe.Status, &traineePartnerID, 
			&swe.CreatedByID, &swe.CreatedAt, &swe.EventTitle, &swe.EventDate, &swe.Location, 
			&swe.EventType); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar agendamentos",
			})
			return
		}
		
		swe.TraineePartnerID = traineePartnerID
		schedulesWithEvents = append(schedulesWithEvents, swe)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    schedulesWithEvents,
	})
}

// checkSchedulingConflict verifica se há conflito de horário para um voluntário em um evento
func checkSchedulingConflict(eventID, volunteerID int) (bool, error) {
	// Obter data e hora do evento
	var eventDate time.Time
	err := db.DB.QueryRow(context.Background(), 
		"SELECT event_date FROM events WHERE id = $1", eventID).Scan(&eventDate)
	if err != nil {
		return false, err
	}

	// Buscar outros eventos no mesmo dia para os quais o voluntário já está agendado
	rows, err := db.DB.Query(context.Background(), 
		`SELECT e.id, e.event_date
		 FROM schedules s
		 JOIN events e ON s.event_id = e.id
		 WHERE s.volunteer_id = $1 AND e.id != $2
		 AND DATE(e.event_date) = DATE($3)`, volunteerID, eventID, eventDate)
	if err != nil {
		return false, err
	}
	defer rows.Close()

	// Se encontrarmos qualquer evento no mesmo dia, consideramos como conflito
	// Em uma implementação mais avançada, poderíamos comparar horários específicos
	return rows.Next(), nil
}