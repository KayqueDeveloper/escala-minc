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

// GetEvents retorna todos os eventos
func GetEvents(c *gin.Context) {
	rows, err := db.DB.Query(context.Background(), 
		`SELECT id, title, description, location, event_date, event_type, recurrent, created_at 
		 FROM events
		 ORDER BY event_date DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar eventos",
		})
		return
	}
	defer rows.Close()

	var events []models.Event
	for rows.Next() {
		var event models.Event
		if err := rows.Scan(&event.ID, &event.Title, &event.Description, &event.Location, 
			&event.EventDate, &event.EventType, &event.Recurrent, &event.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar eventos",
			})
			return
		}
		events = append(events, event)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    events,
	})
}

// GetEvent retorna um evento específico pelo ID
func GetEvent(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	var event models.Event
	err = db.DB.QueryRow(context.Background(),
		`SELECT id, title, description, location, event_date, event_type, recurrent, created_at 
		 FROM events WHERE id = $1`, id).
		Scan(&event.ID, &event.Title, &event.Description, &event.Location, 
			&event.EventDate, &event.EventType, &event.Recurrent, &event.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Evento não encontrado",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    event,
	})
}

// CreateEvent cria um novo evento
func CreateEvent(c *gin.Context) {
	var eventRequest models.EventRequest

	if err := c.ShouldBindJSON(&eventRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	var event models.Event
	err := db.DB.QueryRow(context.Background(),
		`INSERT INTO events (title, description, location, event_date, event_type, recurrent) 
		 VALUES ($1, $2, $3, $4, $5, $6) 
		 RETURNING id, title, description, location, event_date, event_type, recurrent, created_at`,
		eventRequest.Title, eventRequest.Description, eventRequest.Location, 
		eventRequest.EventDate, eventRequest.EventType, eventRequest.Recurrent).
		Scan(&event.ID, &event.Title, &event.Description, &event.Location, 
			&event.EventDate, &event.EventType, &event.Recurrent, &event.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao criar evento",
		})
		return
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success: true,
		Message: "Evento criado com sucesso",
		Data:    event,
	})
}

// UpdateEvent atualiza um evento existente
func UpdateEvent(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	var eventRequest models.EventRequest
	if err := c.ShouldBindJSON(&eventRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	// Verificar se o evento existe
	var exists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM events WHERE id = $1)", id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar evento",
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Evento não encontrado",
		})
		return
	}

	// Atualizar evento
	var event models.Event
	err = db.DB.QueryRow(context.Background(),
		`UPDATE events 
		 SET title = $1, description = $2, location = $3, event_date = $4, event_type = $5, recurrent = $6 
		 WHERE id = $7 
		 RETURNING id, title, description, location, event_date, event_type, recurrent, created_at`,
		eventRequest.Title, eventRequest.Description, eventRequest.Location, 
		eventRequest.EventDate, eventRequest.EventType, eventRequest.Recurrent, id).
		Scan(&event.ID, &event.Title, &event.Description, &event.Location, 
			&event.EventDate, &event.EventType, &event.Recurrent, &event.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao atualizar evento",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Evento atualizado com sucesso",
		Data:    event,
	})
}

// DeleteEvent remove um evento
func DeleteEvent(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	// Verificar se o evento existe
	var exists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM events WHERE id = $1)", id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar evento",
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Evento não encontrado",
		})
		return
	}

	// Verificar dependências (schedules)
	var hasSchedules bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM schedules WHERE event_id = $1)", id).Scan(&hasSchedules)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar agendamentos",
		})
		return
	}

	if hasSchedules {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Não é possível excluir evento com agendamentos associados",
		})
		return
	}

	// Excluir evento
	_, err = db.DB.Exec(context.Background(), "DELETE FROM events WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao excluir evento",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Evento excluído com sucesso",
	})
}

// GetUpcomingEvents retorna os próximos eventos
func GetUpcomingEvents(c *gin.Context) {
	// Obter eventos futuros (a partir de hoje)
	rows, err := db.DB.Query(context.Background(), 
		`SELECT e.id, e.title, e.description, e.location, e.event_date, e.event_type, e.recurrent, e.created_at,
			(SELECT COUNT(*) FROM schedules s WHERE s.event_id = e.id) as schedule_count
		 FROM events e
		 WHERE e.event_date >= $1
		 ORDER BY e.event_date ASC
		 LIMIT 5`, time.Now())

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar próximos eventos",
		})
		return
	}
	defer rows.Close()

	type UpcomingEvent struct {
		models.Event
		ScheduleCount int `json:"scheduleCount"`
	}

	var upcomingEvents []UpcomingEvent
	for rows.Next() {
		var event UpcomingEvent
		if err := rows.Scan(&event.ID, &event.Title, &event.Description, &event.Location, 
			&event.EventDate, &event.EventType, &event.Recurrent, &event.CreatedAt, &event.ScheduleCount); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar próximos eventos",
			})
			return
		}
		upcomingEvents = append(upcomingEvents, event)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    upcomingEvents,
	})
}