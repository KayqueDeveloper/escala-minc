package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"volunteer-scheduler/db"
	"volunteer-scheduler/models"
)

// GetVolunteers retorna todos os voluntários
func GetVolunteers(c *gin.Context) {
	rows, err := db.DB.Query(context.Background(), 
		`SELECT v.id, v.user_id, v.team_id, v.role_id, v.is_trainee
		 FROM volunteers v`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar voluntários",
		})
		return
	}
	defer rows.Close()

	var volunteers []models.Volunteer
	for rows.Next() {
		var volunteer models.Volunteer
		if err := rows.Scan(&volunteer.ID, &volunteer.UserID, &volunteer.TeamID, 
			&volunteer.RoleID, &volunteer.IsTrainee); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar voluntários",
			})
			return
		}
		volunteers = append(volunteers, volunteer)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    volunteers,
	})
}

// GetVolunteer retorna um voluntário específico pelo ID
func GetVolunteer(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	var volunteer models.Volunteer
	err = db.DB.QueryRow(context.Background(),
		`SELECT id, user_id, team_id, role_id, is_trainee
		 FROM volunteers WHERE id = $1`, id).
		Scan(&volunteer.ID, &volunteer.UserID, &volunteer.TeamID, &volunteer.RoleID, &volunteer.IsTrainee)

	if err != nil {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Voluntário não encontrado",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    volunteer,
	})
}

// CreateVolunteer cria um novo voluntário
func CreateVolunteer(c *gin.Context) {
	var volunteerRequest models.VolunteerRequest

	if err := c.ShouldBindJSON(&volunteerRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	// Verificar se o usuário existe
	var userExists bool
	err := db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)", 
		volunteerRequest.UserID).Scan(&userExists)
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

	// Verificar se o time existe
	var teamExists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM teams WHERE id = $1)", 
		volunteerRequest.TeamID).Scan(&teamExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar time",
		})
		return
	}

	if !teamExists {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Time não encontrado",
		})
		return
	}

	// Verificar se o papel existe
	var roleExists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM roles WHERE id = $1)", 
		volunteerRequest.RoleID).Scan(&roleExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar papel",
		})
		return
	}

	if !roleExists {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Papel não encontrado",
		})
		return
	}

	// Verificar se o papel pertence ao time
	var roleTeamMatch bool
	err = db.DB.QueryRow(context.Background(), 
		"SELECT EXISTS(SELECT 1 FROM roles WHERE id = $1 AND team_id = $2)", 
		volunteerRequest.RoleID, volunteerRequest.TeamID).Scan(&roleTeamMatch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar associação papel-time",
		})
		return
	}

	if !roleTeamMatch {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "O papel selecionado não pertence ao time selecionado",
		})
		return
	}

	// Verificar se o voluntário já existe para esse usuário e time
	var volunteerExists bool
	err = db.DB.QueryRow(context.Background(), 
		"SELECT EXISTS(SELECT 1 FROM volunteers WHERE user_id = $1 AND team_id = $2)", 
		volunteerRequest.UserID, volunteerRequest.TeamID).Scan(&volunteerExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar voluntário existente",
		})
		return
	}

	if volunteerExists {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Este usuário já é voluntário neste time",
		})
		return
	}

	// Criar voluntário
	var volunteer models.Volunteer
	err = db.DB.QueryRow(context.Background(),
		`INSERT INTO volunteers (user_id, team_id, role_id, is_trainee) 
		 VALUES ($1, $2, $3, $4) 
		 RETURNING id, user_id, team_id, role_id, is_trainee`,
		volunteerRequest.UserID, volunteerRequest.TeamID, 
		volunteerRequest.RoleID, volunteerRequest.IsTrainee).
		Scan(&volunteer.ID, &volunteer.UserID, &volunteer.TeamID, 
			&volunteer.RoleID, &volunteer.IsTrainee)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao criar voluntário",
		})
		return
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success: true,
		Message: "Voluntário criado com sucesso",
		Data:    volunteer,
	})
}

// UpdateVolunteer atualiza um voluntário existente
func UpdateVolunteer(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	var volunteerRequest models.VolunteerRequest
	if err := c.ShouldBindJSON(&volunteerRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	// Verificar se o voluntário existe
	var exists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM volunteers WHERE id = $1)", id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar voluntário",
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Voluntário não encontrado",
		})
		return
	}

	// Verificar se o papel pertence ao time
	var roleTeamMatch bool
	err = db.DB.QueryRow(context.Background(), 
		"SELECT EXISTS(SELECT 1 FROM roles WHERE id = $1 AND team_id = $2)", 
		volunteerRequest.RoleID, volunteerRequest.TeamID).Scan(&roleTeamMatch)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar associação papel-time",
		})
		return
	}

	if !roleTeamMatch {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "O papel selecionado não pertence ao time selecionado",
		})
		return
	}

	// Atualizar voluntário
	var volunteer models.Volunteer
	err = db.DB.QueryRow(context.Background(),
		`UPDATE volunteers 
		 SET user_id = $1, team_id = $2, role_id = $3, is_trainee = $4 
		 WHERE id = $5 
		 RETURNING id, user_id, team_id, role_id, is_trainee`,
		volunteerRequest.UserID, volunteerRequest.TeamID, 
		volunteerRequest.RoleID, volunteerRequest.IsTrainee, id).
		Scan(&volunteer.ID, &volunteer.UserID, &volunteer.TeamID, 
			&volunteer.RoleID, &volunteer.IsTrainee)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao atualizar voluntário",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Voluntário atualizado com sucesso",
		Data:    volunteer,
	})
}

// DeleteVolunteer remove um voluntário
func DeleteVolunteer(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID inválido",
		})
		return
	}

	// Verificar se o voluntário existe
	var exists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM volunteers WHERE id = $1)", id).Scan(&exists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar voluntário",
		})
		return
	}

	if !exists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Voluntário não encontrado",
		})
		return
	}

	// Verificar dependências (schedules)
	var hasSchedules bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM schedules WHERE volunteer_id = $1)", id).Scan(&hasSchedules)
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
			Error:   "Não é possível excluir voluntário com agendamentos associados",
		})
		return
	}

	// Verificar dependências (availability_rules)
	var hasRules bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM availability_rules WHERE volunteer_id = $1)", id).Scan(&hasRules)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar regras de disponibilidade",
		})
		return
	}

	if hasRules {
		// Excluir regras de disponibilidade associadas
		_, err = db.DB.Exec(context.Background(), "DELETE FROM availability_rules WHERE volunteer_id = $1", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao excluir regras de disponibilidade",
			})
			return
		}
	}

	// Excluir voluntário
	_, err = db.DB.Exec(context.Background(), "DELETE FROM volunteers WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao excluir voluntário",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Voluntário excluído com sucesso",
	})
}

// GetVolunteersByTeam retorna todos os voluntários de um time específico
func GetVolunteersByTeam(c *gin.Context) {
	teamID, err := strconv.Atoi(c.Param("teamId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "ID de time inválido",
		})
		return
	}

	// Verificar se o time existe
	var teamExists bool
	err = db.DB.QueryRow(context.Background(), "SELECT EXISTS(SELECT 1 FROM teams WHERE id = $1)", teamID).Scan(&teamExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar time",
		})
		return
	}

	if !teamExists {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Time não encontrado",
		})
		return
	}

	// Buscar voluntários do time com informações detalhadas
	rows, err := db.DB.Query(context.Background(), 
		`SELECT v.id, v.user_id, v.team_id, v.role_id, v.is_trainee,
		        u.name as user_name, u.email as user_email,
		        r.name as role_name
		 FROM volunteers v
		 JOIN users u ON v.user_id = u.id
		 JOIN roles r ON v.role_id = r.id
		 WHERE v.team_id = $1`, teamID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar voluntários do time",
		})
		return
	}
	defer rows.Close()

	type VolunteerDetails struct {
		models.Volunteer
		UserName  string `json:"userName"`
		UserEmail string `json:"userEmail"`
		RoleName  string `json:"roleName"`
	}

	var volunteers []VolunteerDetails
	for rows.Next() {
		var v VolunteerDetails
		if err := rows.Scan(&v.ID, &v.UserID, &v.TeamID, &v.RoleID, &v.IsTrainee,
			&v.UserName, &v.UserEmail, &v.RoleName); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar voluntários",
			})
			return
		}
		volunteers = append(volunteers, v)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    volunteers,
	})
}

// GetAllVolunteersWithTeams retorna todos os voluntários com informações de time
func GetAllVolunteersWithTeams(c *gin.Context) {
	rows, err := db.DB.Query(context.Background(), 
		`SELECT v.id, v.user_id, v.team_id, v.role_id, v.is_trainee,
		        u.name as user_name, u.email as user_email,
		        t.name as team_name,
		        r.name as role_name
		 FROM volunteers v
		 JOIN users u ON v.user_id = u.id
		 JOIN teams t ON v.team_id = t.id
		 JOIN roles r ON v.role_id = r.id`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao buscar voluntários",
		})
		return
	}
	defer rows.Close()

	type VolunteerWithTeam struct {
		models.Volunteer
		UserName  string `json:"userName"`
		UserEmail string `json:"userEmail"`
		TeamName  string `json:"teamName"`
		RoleName  string `json:"roleName"`
	}

	var volunteersWithTeams []VolunteerWithTeam
	for rows.Next() {
		var v VolunteerWithTeam
		if err := rows.Scan(&v.ID, &v.UserID, &v.TeamID, &v.RoleID, &v.IsTrainee,
			&v.UserName, &v.UserEmail, &v.TeamName, &v.RoleName); err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Success: false,
				Error:   "Erro ao processar voluntários",
			})
			return
		}
		volunteersWithTeams = append(volunteersWithTeams, v)
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    volunteersWithTeams,
	})
}