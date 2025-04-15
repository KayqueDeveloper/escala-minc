package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"volunteer-scheduler/db"
	"volunteer-scheduler/models"
)

// GetNotifications retorna todas as notificações de um usuário
func GetNotifications(c *gin.Context) {
	// Obter o ID do usuário a partir do token JWT
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error:   "Usuário não autenticado",
		})
		return
	}

	rows, err := db.DB.Query(context.Background(), 
		`SELECT id, user_id, title, message, type, read, created_at
		 FROM notifications
		 WHERE user_id = $1
		 ORDER BY created_at DESC
		 LIMIT 100`, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar notificações",
		})
		return
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var notification models.Notification
		if err := rows.Scan(&notification.ID, &notification.UserID, &notification.Title, 
			&notification.Message, &notification.Type, &notification.Read, &notification.CreatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar notificações",
			})
			return
		}
		notifications = append(notifications, notification)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    notifications,
	})
}

// MarkNotificationAsRead marca uma notificação como lida
func MarkNotificationAsRead(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	// Obter o ID do usuário a partir do token JWT
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error:   "Usuário não autenticado",
		})
		return
	}

	// Verificar se a notificação existe e pertence ao usuário
	var notificationExists bool
	err = db.DB.QueryRow(context.Background(), 
		"SELECT EXISTS(SELECT 1 FROM notifications WHERE id = $1 AND user_id = $2)", 
		id, userID).Scan(&notificationExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar notificação",
		})
		return
	}

	if !notificationExists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Notificação não encontrada ou não pertence ao usuário",
		})
		return
	}

	// Atualizar notificação
	var notification models.Notification
	err = db.DB.QueryRow(context.Background(),
		`UPDATE notifications 
		 SET read = true 
		 WHERE id = $1 
		 RETURNING id, user_id, title, message, type, read, created_at`,
		id).Scan(&notification.ID, &notification.UserID, &notification.Title, 
			&notification.Message, &notification.Type, &notification.Read, &notification.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao atualizar notificação",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Notificação marcada como lida",
		Data:    notification,
	})
}

// GetUnreadNotificationsCount retorna o número de notificações não lidas
func GetUnreadNotificationsCount(c *gin.Context) {
	// Obter o ID do usuário a partir do token JWT
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error:   "Usuário não autenticado",
		})
		return
	}

	var count int
	err := db.DB.QueryRow(context.Background(), 
		`SELECT COUNT(*) 
		 FROM notifications 
		 WHERE user_id = $1 AND read = false`, userID).Scan(&count)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao contar notificações não lidas",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: map[string]int{
			"count": count,
		},
	})
}

// CreateNotification cria uma nova notificação
func CreateNotification(c *gin.Context) {
	var notificationRequest models.NotificationRequest

	if err := c.ShouldBindJSON(&notificationRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	// Verificar se o usuário existe
	var userExists bool
	err := db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)", 
		notificationRequest.UserID).Scan(&userExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar usuário",
		})
		return
	}

	if !userExists {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Usuário não encontrado",
		})
		return
	}

	// Criar notificação
	var notification models.Notification
	err = db.DB.QueryRow(context.Background(),
		`INSERT INTO notifications (user_id, title, message, type) 
		 VALUES ($1, $2, $3, $4) 
		 RETURNING id, user_id, title, message, type, read, created_at`,
		notificationRequest.UserID, notificationRequest.Title, 
		notificationRequest.Message, notificationRequest.Type).
		Scan(&notification.ID, &notification.UserID, &notification.Title, 
			&notification.Message, &notification.Type, &notification.Read, &notification.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao criar notificação",
		})
		return
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success: true,
		Message: "Notificação criada com sucesso",
		Data:    notification,
	})
}

// DeleteNotification exclui uma notificação
func DeleteNotification(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	// Obter o ID do usuário a partir do token JWT
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error:   "Usuário não autenticado",
		})
		return
	}

	// Verificar se a notificação existe e pertence ao usuário
	var notificationExists bool
	err = db.DB.QueryRow(context.Background(), 
		"SELECT EXISTS(SELECT 1 FROM notifications WHERE id = $1 AND user_id = $2)", 
		id, userID).Scan(&notificationExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar notificação",
		})
		return
	}

	if !notificationExists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Notificação não encontrada ou não pertence ao usuário",
		})
		return
	}

	// Excluir notificação
	_, err = db.DB.Exec(context.Background(), "DELETE FROM notifications WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao excluir notificação",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Notificação excluída com sucesso",
	})
}

// MarkAllNotificationsAsRead marca todas as notificações do usuário como lidas
func MarkAllNotificationsAsRead(c *gin.Context) {
	// Obter o ID do usuário a partir do token JWT
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error:   "Usuário não autenticado",
		})
		return
	}

	// Atualizar todas as notificações do usuário
	_, err := db.DB.Exec(context.Background(),
		"UPDATE notifications SET read = true WHERE user_id = $1 AND read = false",
		userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao marcar notificações como lidas",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Todas as notificações foram marcadas como lidas",
	})
}