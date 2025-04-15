package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"volunteer-scheduler/db"
	"volunteer-scheduler/models"
)

// GetSwapRequests retorna todas as solicitações de troca
func GetSwapRequests(c *gin.Context) {
	rows, err := db.DB.Query(context.Background(), 
		`SELECT sr.id, sr.requestor_schedule_id, sr.target_schedule_id, sr.target_volunteer_id, 
		        sr.reason, sr.status, sr.created_at,
		        e1.title as requestor_event_title, e1.event_date as requestor_event_date,
		        u1.name as requestor_name,
		        COALESCE(e2.title, '') as target_event_title, 
		        COALESCE(e2.event_date, '1970-01-01'::timestamp) as target_event_date,
		        COALESCE(u2.name, '') as target_name
		 FROM swap_requests sr
		 JOIN schedules s1 ON sr.requestor_schedule_id = s1.id
		 JOIN events e1 ON s1.event_id = e1.id
		 JOIN volunteers v1 ON s1.volunteer_id = v1.id
		 JOIN users u1 ON v1.user_id = u1.id
		 LEFT JOIN schedules s2 ON sr.target_schedule_id = s2.id
		 LEFT JOIN events e2 ON s2.event_id = e2.id
		 LEFT JOIN volunteers v2 ON COALESCE(s2.volunteer_id, sr.target_volunteer_id) = v2.id
		 LEFT JOIN users u2 ON v2.user_id = u2.id
		 ORDER BY sr.created_at DESC`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar solicitações de troca",
		})
		return
	}
	defer rows.Close()

	type SwapRequestDetail struct {
		ID                  int       `json:"id"`
		RequestorScheduleID int       `json:"requestorScheduleId"`
		TargetScheduleID    *int      `json:"targetScheduleId"`
		TargetVolunteerID   *int      `json:"targetVolunteerId"`
		Reason              string    `json:"reason"`
		Status              string    `json:"status"`
		CreatedAt           string    `json:"createdAt"`
		RequestorEventTitle string    `json:"requestorEventTitle"`
		RequestorEventDate  string    `json:"requestorEventDate"`
		RequestorName       string    `json:"requestorName"`
		TargetEventTitle    string    `json:"targetEventTitle"`
		TargetEventDate     string    `json:"targetEventDate"`
		TargetName          string    `json:"targetName"`
	}

	var swapRequests []SwapRequestDetail
	for rows.Next() {
		var sr SwapRequestDetail
		var targetScheduleID, targetVolunteerID *int
		if err := rows.Scan(
			&sr.ID, &sr.RequestorScheduleID, &targetScheduleID, &targetVolunteerID, 
			&sr.Reason, &sr.Status, &sr.CreatedAt, 
			&sr.RequestorEventTitle, &sr.RequestorEventDate, &sr.RequestorName,
			&sr.TargetEventTitle, &sr.TargetEventDate, &sr.TargetName); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar solicitações de troca",
			})
			return
		}
		
		sr.TargetScheduleID = targetScheduleID
		sr.TargetVolunteerID = targetVolunteerID
		swapRequests = append(swapRequests, sr)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    swapRequests,
	})
}

// GetSwapRequest retorna uma solicitação de troca específica pelo ID
func GetSwapRequest(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	var sr models.SwapRequest
	var targetScheduleID, targetVolunteerID *int
	err = db.DB.QueryRow(context.Background(),
		`SELECT id, requestor_schedule_id, target_schedule_id, target_volunteer_id, reason, status, created_at
		 FROM swap_requests 
		 WHERE id = $1`, id).
		Scan(&sr.ID, &sr.RequestorScheduleID, &targetScheduleID, &targetVolunteerID, 
			&sr.Reason, &sr.Status, &sr.CreatedAt)

	if err != nil {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Solicitação de troca não encontrada",
		})
		return
	}
	
	sr.TargetScheduleID = targetScheduleID
	sr.TargetVolunteerID = targetVolunteerID

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    sr,
	})
}

// CreateSwapRequest cria uma nova solicitação de troca
func CreateSwapRequest(c *gin.Context) {
	var swapRequestRequest models.SwapRequestRequest

	if err := c.ShouldBindJSON(&swapRequestRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	// Verificar se o agendamento do solicitante existe
	var requestorScheduleExists bool
	err := db.DB.QueryRow(context.Background(), 
		"SELECT EXISTS(SELECT 1 FROM schedules WHERE id = $1)", 
		swapRequestRequest.RequestorScheduleID).Scan(&requestorScheduleExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar agendamento do solicitante",
		})
		return
	}

	if !requestorScheduleExists {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Agendamento do solicitante não encontrado",
		})
		return
	}

	// Se um target_schedule_id for fornecido, verificar se existe
	if swapRequestRequest.TargetScheduleID != nil {
		var targetScheduleExists bool
		err := db.DB.QueryRow(context.Background(), 
			"SELECT EXISTS(SELECT 1 FROM schedules WHERE id = $1)", 
			*swapRequestRequest.TargetScheduleID).Scan(&targetScheduleExists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao verificar agendamento alvo",
			})
			return
		}

		if !targetScheduleExists {
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error:   "Agendamento alvo não encontrado",
			})
			return
		}
	}

	// Se um target_volunteer_id for fornecido, verificar se existe
	if swapRequestRequest.TargetVolunteerID != nil {
		var targetVolunteerExists bool
		err := db.DB.QueryRow(context.Background(), 
			"SELECT EXISTS(SELECT 1 FROM volunteers WHERE id = $1)", 
			*swapRequestRequest.TargetVolunteerID).Scan(&targetVolunteerExists)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao verificar voluntário alvo",
			})
			return
		}

		if !targetVolunteerExists {
			c.JSON(http.StatusBadRequest, models.ApiResponse{
				Success: false,
				Error:   "Voluntário alvo não encontrado",
			})
			return
		}
	}

	// Definir status padrão se não fornecido
	if swapRequestRequest.Status == "" {
		swapRequestRequest.Status = "pending"
	}

	// Criar solicitação de troca
	var swapRequest models.SwapRequest
	err = db.DB.QueryRow(context.Background(),
		`INSERT INTO swap_requests (requestor_schedule_id, target_schedule_id, target_volunteer_id, reason, status) 
		 VALUES ($1, $2, $3, $4, $5) 
		 RETURNING id, requestor_schedule_id, target_schedule_id, target_volunteer_id, reason, status, created_at`,
		swapRequestRequest.RequestorScheduleID, swapRequestRequest.TargetScheduleID, 
		swapRequestRequest.TargetVolunteerID, swapRequestRequest.Reason, swapRequestRequest.Status).
		Scan(&swapRequest.ID, &swapRequest.RequestorScheduleID, &swapRequest.TargetScheduleID, 
			&swapRequest.TargetVolunteerID, &swapRequest.Reason, &swapRequest.Status, &swapRequest.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao criar solicitação de troca",
		})
		return
	}

	// Obter informações do solicitante para criar notificação
	var requestorUserId int
	err = db.DB.QueryRow(context.Background(),
		`SELECT v.user_id 
		 FROM schedules s
		 JOIN volunteers v ON s.volunteer_id = v.id
		 WHERE s.id = $1`, swapRequestRequest.RequestorScheduleID).Scan(&requestorUserId)
	if err != nil {
		// Não abortar a criação da solicitação se a notificação falhar
		c.JSON(http.StatusCreated, models.ApiResponse{
			Success: true,
			Message: "Solicitação de troca criada com sucesso, mas não foi possível criar notificação",
			Data:    swapRequest,
		})
		return
	}

	// Obter informações do evento para a notificação
	var eventTitle string
	err = db.DB.QueryRow(context.Background(),
		`SELECT e.title 
		 FROM schedules s
		 JOIN events e ON s.event_id = e.id
		 WHERE s.id = $1`, swapRequestRequest.RequestorScheduleID).Scan(&eventTitle)
	if err != nil {
		// Não abortar a criação da solicitação se a notificação falhar
		c.JSON(http.StatusCreated, models.ApiResponse{
			Success: true,
			Message: "Solicitação de troca criada com sucesso, mas não foi possível criar notificação",
			Data:    swapRequest,
		})
		return
	}

	// Determinar o destinatário da notificação
	var targetUserId int
	if swapRequestRequest.TargetScheduleID != nil {
		// Se houver um agendamento alvo, notificar o voluntário desse agendamento
		err = db.DB.QueryRow(context.Background(),
			`SELECT v.user_id 
			 FROM schedules s
			 JOIN volunteers v ON s.volunteer_id = v.id
			 WHERE s.id = $1`, *swapRequestRequest.TargetScheduleID).Scan(&targetUserId)
	} else if swapRequestRequest.TargetVolunteerID != nil {
		// Se houver um voluntário alvo, notificá-lo diretamente
		err = db.DB.QueryRow(context.Background(),
			`SELECT user_id 
			 FROM volunteers
			 WHERE id = $1`, *swapRequestRequest.TargetVolunteerID).Scan(&targetUserId)
	} else {
		// Sem alvo específico, notificar um líder de equipe
		err = db.DB.QueryRow(context.Background(),
			`SELECT t.leader_id 
			 FROM schedules s
			 JOIN volunteers v ON s.volunteer_id = v.id
			 JOIN teams t ON v.team_id = t.id
			 WHERE s.id = $1`, swapRequestRequest.RequestorScheduleID).Scan(&targetUserId)
	}

	if err != nil {
		// Não abortar a criação da solicitação se a notificação falhar
		c.JSON(http.StatusCreated, models.ApiResponse{
			Success: true,
			Message: "Solicitação de troca criada com sucesso, mas não foi possível criar notificação",
			Data:    swapRequest,
		})
		return
	}

	// Criar notificação
	_, err = db.DB.Exec(context.Background(),
		`INSERT INTO notifications (user_id, title, message, type) 
		 VALUES ($1, $2, $3, $4)`,
		targetUserId, 
		"Nova solicitação de troca", 
		"Há uma nova solicitação de troca para o evento " + eventTitle,
		"swap_request")

	if err != nil {
		// Não abortar a criação da solicitação se a notificação falhar
		c.JSON(http.StatusCreated, models.ApiResponse{
			Success: true,
			Message: "Solicitação de troca criada com sucesso, mas não foi possível criar notificação",
			Data:    swapRequest,
		})
		return
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success: true,
		Message: "Solicitação de troca criada com sucesso",
		Data:    swapRequest,
	})
}

// ApproveSwapRequest aprova uma solicitação de troca
func ApproveSwapRequest(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	// Verificar se a solicitação existe e está pendente
	var exists bool
	var status string
	err = db.DB.QueryRow(context.Background(), 
		"SELECT EXISTS(SELECT 1 FROM swap_requests WHERE id = $1), (SELECT status FROM swap_requests WHERE id = $1)", 
		id).Scan(&exists, &status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar solicitação de troca",
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Solicitação de troca não encontrada",
		})
		return
	}

	if status != "pending" {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Só é possível aprovar solicitações pendentes",
		})
		return
	}

	// Iniciar transação
	tx, err := db.DB.Begin(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao iniciar transação",
		})
		return
	}
	defer tx.Rollback(context.Background())

	// Atualizar status da solicitação
	_, err = tx.Exec(context.Background(), 
		"UPDATE swap_requests SET status = 'approved' WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao atualizar solicitação de troca",
		})
		return
	}

	// Obter dados necessários para a troca
	var requestorScheduleID int
	var targetScheduleID, targetVolunteerID *int
	err = tx.QueryRow(context.Background(),
		"SELECT requestor_schedule_id, target_schedule_id, target_volunteer_id FROM swap_requests WHERE id = $1", 
		id).Scan(&requestorScheduleID, &targetScheduleID, &targetVolunteerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao obter dados da solicitação",
		})
		return
	}

	// Dados para notificação
	var requestorUserId int
	var eventTitle string
	err = tx.QueryRow(context.Background(),
		`SELECT v.user_id, e.title
		 FROM schedules s
		 JOIN volunteers v ON s.volunteer_id = v.id
		 JOIN events e ON s.event_id = e.id
		 WHERE s.id = $1`, requestorScheduleID).Scan(&requestorUserId, &eventTitle)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao obter dados para notificação",
		})
		return
	}

	// Se tivermos um agendamento alvo, trocar os voluntários
	if targetScheduleID != nil {
		var targetVolunteerId, requestorVolunteerId int
		err = tx.QueryRow(context.Background(),
			"SELECT volunteer_id FROM schedules WHERE id = $1", *targetScheduleID).Scan(&targetVolunteerId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao obter voluntário alvo",
			})
			return
		}

		err = tx.QueryRow(context.Background(),
			"SELECT volunteer_id FROM schedules WHERE id = $1", requestorScheduleID).Scan(&requestorVolunteerId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao obter voluntário solicitante",
			})
			return
		}

		// Trocar os voluntários
		_, err = tx.Exec(context.Background(),
			"UPDATE schedules SET volunteer_id = $1 WHERE id = $2", targetVolunteerId, requestorScheduleID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao atualizar agendamento solicitante",
			})
			return
		}

		_, err = tx.Exec(context.Background(),
			"UPDATE schedules SET volunteer_id = $1 WHERE id = $2", requestorVolunteerId, *targetScheduleID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao atualizar agendamento alvo",
			})
			return
		}
	} else if targetVolunteerID != nil {
		// Se tivermos apenas um voluntário alvo, substituir o voluntário no agendamento do solicitante
		_, err = tx.Exec(context.Background(),
			"UPDATE schedules SET volunteer_id = $1 WHERE id = $2", *targetVolunteerID, requestorScheduleID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao atualizar agendamento",
			})
			return
		}
	} else {
		// Se não tivermos um alvo, apenas cancelar o agendamento do solicitante
		_, err = tx.Exec(context.Background(),
			"UPDATE schedules SET status = 'cancelled' WHERE id = $1", requestorScheduleID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao cancelar agendamento",
			})
			return
		}
	}

	// Criar notificação para o solicitante
	_, err = tx.Exec(context.Background(),
		`INSERT INTO notifications (user_id, title, message, type) 
		 VALUES ($1, $2, $3, $4)`,
		requestorUserId, 
		"Solicitação de troca aprovada", 
		"Sua solicitação de troca para o evento " + eventTitle + " foi aprovada",
		"swap_request")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao criar notificação",
		})
		return
	}

	// Confirmar transação
	err = tx.Commit(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao confirmar transação",
		})
		return
	}

	// Buscar a solicitação atualizada
	var swapRequest models.SwapRequest
	err = db.DB.QueryRow(context.Background(),
		`SELECT id, requestor_schedule_id, target_schedule_id, target_volunteer_id, reason, status, created_at
		 FROM swap_requests 
		 WHERE id = $1`, id).
		Scan(&swapRequest.ID, &swapRequest.RequestorScheduleID, &swapRequest.TargetScheduleID, 
			&swapRequest.TargetVolunteerID, &swapRequest.Reason, &swapRequest.Status, &swapRequest.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao obter solicitação atualizada",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Solicitação de troca aprovada com sucesso",
		Data:    swapRequest,
	})
}

// RejectSwapRequest rejeita uma solicitação de troca
func RejectSwapRequest(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	// Verificar se a solicitação existe e está pendente
	var exists bool
	var status string
	err = db.DB.QueryRow(context.Background(), 
		"SELECT EXISTS(SELECT 1 FROM swap_requests WHERE id = $1), (SELECT status FROM swap_requests WHERE id = $1)", 
		id).Scan(&exists, &status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar solicitação de troca",
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Solicitação de troca não encontrada",
		})
		return
	}

	if status != "pending" {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Só é possível rejeitar solicitações pendentes",
		})
		return
	}

	// Iniciar transação
	tx, err := db.DB.Begin(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao iniciar transação",
		})
		return
	}
	defer tx.Rollback(context.Background())

	// Atualizar status da solicitação
	_, err = tx.Exec(context.Background(), 
		"UPDATE swap_requests SET status = 'rejected' WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao atualizar solicitação de troca",
		})
		return
	}

	// Obter dados necessários para a notificação
	var requestorScheduleID int
	err = tx.QueryRow(context.Background(),
		"SELECT requestor_schedule_id FROM swap_requests WHERE id = $1", 
		id).Scan(&requestorScheduleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao obter dados da solicitação",
		})
		return
	}

	// Dados para notificação
	var requestorUserId int
	var eventTitle string
	err = tx.QueryRow(context.Background(),
		`SELECT v.user_id, e.title
		 FROM schedules s
		 JOIN volunteers v ON s.volunteer_id = v.id
		 JOIN events e ON s.event_id = e.id
		 WHERE s.id = $1`, requestorScheduleID).Scan(&requestorUserId, &eventTitle)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao obter dados para notificação",
		})
		return
	}

	// Criar notificação para o solicitante
	_, err = tx.Exec(context.Background(),
		`INSERT INTO notifications (user_id, title, message, type) 
		 VALUES ($1, $2, $3, $4)`,
		requestorUserId, 
		"Solicitação de troca rejeitada", 
		"Sua solicitação de troca para o evento " + eventTitle + " foi rejeitada",
		"swap_request")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao criar notificação",
		})
		return
	}

	// Confirmar transação
	err = tx.Commit(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao confirmar transação",
		})
		return
	}

	// Buscar a solicitação atualizada
	var swapRequest models.SwapRequest
	err = db.DB.QueryRow(context.Background(),
		`SELECT id, requestor_schedule_id, target_schedule_id, target_volunteer_id, reason, status, created_at
		 FROM swap_requests 
		 WHERE id = $1`, id).
		Scan(&swapRequest.ID, &swapRequest.RequestorScheduleID, &swapRequest.TargetScheduleID, 
			&swapRequest.TargetVolunteerID, &swapRequest.Reason, &swapRequest.Status, &swapRequest.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao obter solicitação atualizada",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Solicitação de troca rejeitada com sucesso",
		Data:    swapRequest,
	})
}