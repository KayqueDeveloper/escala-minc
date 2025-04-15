package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"volunteer-scheduler/db"
	"volunteer-scheduler/models"
)

// GetTeams retorna todas as equipes
func GetTeams(c *gin.Context) {
	rows, err := db.DB.Query(context.Background(), "SELECT id, name, description, leader_id FROM teams")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar equipes",
		})
		return
	}
	defer rows.Close()

	var teams []models.Team
	for rows.Next() {
		var team models.Team
		if err := rows.Scan(&team.ID, &team.Name, &team.Description, &team.LeaderID); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar equipes",
			})
			return
		}
		teams = append(teams, team)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    teams,
	})
}

// GetTeam retorna uma equipe específica pelo ID
func GetTeam(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	var team models.Team
	err = db.DB.QueryRow(context.Background(),
		"SELECT id, name, description, leader_id FROM teams WHERE id = $1", id).
		Scan(&team.ID, &team.Name, &team.Description, &team.LeaderID)

	if err != nil {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Equipe não encontrada",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    team,
	})
}

// CreateTeam cria uma nova equipe
func CreateTeam(c *gin.Context) {
	var teamRequest models.TeamRequest

	if err := c.ShouldBindJSON(&teamRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	var team models.Team
	err := db.DB.QueryRow(context.Background(),
		"INSERT INTO teams (name, description, leader_id) VALUES ($1, $2, $3) RETURNING id, name, description, leader_id",
		teamRequest.Name, teamRequest.Description, teamRequest.LeaderID).
		Scan(&team.ID, &team.Name, &team.Description, &team.LeaderID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao criar equipe",
		})
		return
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success: true,
		Message: "Equipe criada com sucesso",
		Data:    team,
	})
}

// UpdateTeam atualiza uma equipe existente
func UpdateTeam(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	var teamRequest models.TeamRequest
	if err := c.ShouldBindJSON(&teamRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	// Verificar se a equipe existe
	var exists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM teams WHERE id = $1)", id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar equipe",
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Equipe não encontrada",
		})
		return
	}

	// Atualizar equipe
	var team models.Team
	err = db.DB.QueryRow(context.Background(),
		"UPDATE teams SET name = $1, description = $2, leader_id = $3 WHERE id = $4 RETURNING id, name, description, leader_id",
		teamRequest.Name, teamRequest.Description, teamRequest.LeaderID, id).
		Scan(&team.ID, &team.Name, &team.Description, &team.LeaderID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao atualizar equipe",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Equipe atualizada com sucesso",
		Data:    team,
	})
}

// DeleteTeam remove uma equipe
func DeleteTeam(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	// Verificar se a equipe existe
	var exists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM teams WHERE id = $1)", id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar equipe",
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Equipe não encontrada",
		})
		return
	}

	// Verificar dependências (roles, volunteers)
	var hasRoles bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM roles WHERE team_id = $1)", id).Scan(&hasRoles)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar papéis",
		})
		return
	}

	if hasRoles {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Não é possível excluir equipe com papéis associados",
		})
		return
	}

	var hasVolunteers bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM volunteers WHERE team_id = $1)", id).Scan(&hasVolunteers)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar voluntários",
		})
		return
	}

	if hasVolunteers {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Não é possível excluir equipe com voluntários associados",
		})
		return
	}

	// Excluir equipe
	_, err = db.DB.Exec(context.Background(), "DELETE FROM teams WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao excluir equipe",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Equipe excluída com sucesso",
	})
}

// GetTeamsWithRoles retorna todas as equipes com seus papéis
func GetTeamsWithRoles(c *gin.Context) {
	// Primeiro, obter todas as equipes
	rows, err := db.DB.Query(context.Background(), "SELECT id, name, description, leader_id FROM teams")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar equipes",
		})
		return
	}

	var teams []models.Team
	for rows.Next() {
		var team models.Team
		if err := rows.Scan(&team.ID, &team.Name, &team.Description, &team.LeaderID); err != nil {
			rows.Close()
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar equipes",
			})
			return
		}
		teams = append(teams, team)
	}
	rows.Close()

	// Estrutura para manter equipes com seus papéis
	type TeamWithRoles struct {
		Team  models.Team   `json:"team"`
		Roles []models.Role `json:"roles"`
	}

	var teamsWithRoles []TeamWithRoles

	// Para cada equipe, obter seus papéis
	for _, team := range teams {
		roleRows, err := db.DB.Query(context.Background(), "SELECT id, name, team_id, description FROM roles WHERE team_id = $1", team.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao buscar papéis",
			})
			return
		}

		var roles []models.Role
		for roleRows.Next() {
			var role models.Role
			if err := roleRows.Scan(&role.ID, &role.Name, &role.TeamID, &role.Description); err != nil {
				roleRows.Close()
				c.JSON(http.StatusInternalServerError, models.ApiResponse{
					Success: false,
					Error:   "Erro ao processar papéis",
				})
				return
			}
			roles = append(roles, role)
		}
		roleRows.Close()

		teamsWithRoles = append(teamsWithRoles, TeamWithRoles{
			Team:  team,
			Roles: roles,
		})
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    teamsWithRoles,
	})
}