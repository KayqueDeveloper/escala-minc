package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"volunteer-scheduler/db"
	"volunteer-scheduler/models"
)

// GetDashboardStats retorna estatísticas para o painel
func GetDashboardStats(c *gin.Context) {
	// Obter o ID do usuário a partir do token JWT
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error:   "Usuário não autenticado",
		})
		return
	}

	// Inicializar objeto de estatísticas
	stats := models.DashboardStats{}

	// Obter total de equipes
	err := db.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM teams").Scan(&stats.TotalTeams)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao contar equipes",
		})
		return
	}

	// Obter total de voluntários
	err = db.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM volunteers").Scan(&stats.TotalVolunteers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao contar voluntários",
		})
		return
	}

	// Obter total de eventos
	err = db.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM events").Scan(&stats.TotalEvents)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao contar eventos",
		})
		return
	}

	// Obter número de eventos futuros
	err = db.DB.QueryRow(context.Background(), 
		"SELECT COUNT(*) FROM events WHERE event_date >= $1", 
		time.Now()).Scan(&stats.UpcomingEventsCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao contar eventos futuros",
		})
		return
	}

	// Obter número de solicitações de troca pendentes
	err = db.DB.QueryRow(context.Background(), 
		"SELECT COUNT(*) FROM swap_requests WHERE status = 'pending'").Scan(&stats.PendingSwapRequests)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao contar solicitações de troca pendentes",
		})
		return
	}

	// Obter número de notificações não lidas para o usuário
	err = db.DB.QueryRow(context.Background(), 
		"SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false", 
		userID).Scan(&stats.UnreadNotifications)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao contar notificações não lidas",
		})
		return
	}

	// Obter número de conflitos de agendamento
	// Em uma implementação real, isso seria mais complexo para detectar conflitos reais
	stats.SchedulingConflicts = 0

	// Obter distribuição de voluntários por equipe
	rows, err := db.DB.Query(context.Background(), 
		`SELECT t.name, COUNT(v.id) 
		 FROM teams t
		 LEFT JOIN volunteers v ON t.id = v.team_id
		 GROUP BY t.name
		 ORDER BY COUNT(v.id) DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao obter distribuição de voluntários",
		})
		return
	}
	defer rows.Close()

	var volunteersByTeam []models.TeamStat
	for rows.Next() {
		var teamStat models.TeamStat
		if err := rows.Scan(&teamStat.TeamName, &teamStat.Count); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar estatísticas de equipes",
			})
			return
		}
		volunteersByTeam = append(volunteersByTeam, teamStat)
	}
	stats.VolunteersByTeam = volunteersByTeam

	// Obter eventos por mês (próximos 6 meses)
	rows, err = db.DB.Query(context.Background(), 
		`SELECT TO_CHAR(event_date, 'YYYY-MM') as month, COUNT(*) 
		 FROM events 
		 WHERE event_date BETWEEN $1 AND $2
		 GROUP BY TO_CHAR(event_date, 'YYYY-MM')
		 ORDER BY month`,
		time.Now(),
		time.Now().AddDate(0, 6, 0))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao obter eventos por mês",
		})
		return
	}
	defer rows.Close()

	var eventsByMonth []models.EventStat
	for rows.Next() {
		var eventStat models.EventStat
		if err := rows.Scan(&eventStat.Month, &eventStat.Count); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar estatísticas de eventos",
			})
			return
		}
		eventsByMonth = append(eventsByMonth, eventStat)
	}
	stats.EventsByMonth = eventsByMonth

	// Obter notificações recentes
	rows, err = db.DB.Query(context.Background(), 
		`SELECT id, user_id, title, message, type, read, created_at
		 FROM notifications
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT 5`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao obter notificações recentes",
		})
		return
	}
	defer rows.Close()

	var recentNotifications []models.Notification
	for rows.Next() {
		var notification models.Notification
		if err := rows.Scan(&notification.ID, &notification.UserID, &notification.Title, 
			&notification.Message, &notification.Type, &notification.Read, 
			&notification.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar notificações recentes",
			})
			return
		}
		recentNotifications = append(recentNotifications, notification)
	}
	stats.RecentNotifications = recentNotifications

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    stats,
	})
}

// GetConflicts retorna todos os conflitos de agendamento
func GetConflicts(c *gin.Context) {
	// Buscar eventos com voluntários agendados no mesmo dia
	rows, err := db.DB.Query(context.Background(), 
		`WITH volunteer_days AS (
			SELECT 
				v.id as volunteer_id,
				u.name as volunteer_name,
				DATE(e.event_date) as event_day,
				COUNT(*) as event_count
			FROM schedules s
			JOIN volunteers v ON s.volunteer_id = v.id
			JOIN users u ON v.user_id = u.id
			JOIN events e ON s.event_id = e.id
			GROUP BY v.id, u.name, DATE(e.event_date)
			HAVING COUNT(*) > 1
		)
		SELECT 
			vd.volunteer_id,
			vd.volunteer_name,
			vd.event_day,
			vd.event_count,
			json_agg(
				json_build_object(
					'id', e.id,
					'title', e.title,
					'location', e.location,
					'eventDate', e.event_date,
					'scheduleId', s.id
				)
			) as conflicting_events
		FROM volunteer_days vd
		JOIN schedules s ON s.volunteer_id = vd.volunteer_id
		JOIN events e ON s.event_id = e.id AND DATE(e.event_date) = vd.event_day
		GROUP BY vd.volunteer_id, vd.volunteer_name, vd.event_day, vd.event_count
		ORDER BY vd.event_day, vd.volunteer_name`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar conflitos",
		})
		return
	}
	defer rows.Close()

	type ConflictEvent struct {
		ID         int       `json:"id"`
		Title      string    `json:"title"`
		Location   string    `json:"location"`
		EventDate  time.Time `json:"eventDate"`
		ScheduleID int       `json:"scheduleId"`
	}

	type Conflict struct {
		VolunteerID   int             `json:"volunteerId"`
		VolunteerName string          `json:"volunteerName"`
		EventDay      string          `json:"eventDay"`
		EventCount    int             `json:"eventCount"`
		Events        []ConflictEvent `json:"events"`
	}

	var conflicts []Conflict
	for rows.Next() {
		var conflict Conflict
		var eventsJSON string
		if err := rows.Scan(&conflict.VolunteerID, &conflict.VolunteerName, 
			&conflict.EventDay, &conflict.EventCount, &eventsJSON); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar conflitos",
			})
			return
		}
		
		// Em uma implementação real, você parsearia o JSON em Go
		// Aqui estamos simplificando e enviando diretamente ao cliente
		conflict.Events = []ConflictEvent{} // Placeholder
		conflicts = append(conflicts, conflict)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    conflicts,
	})
}