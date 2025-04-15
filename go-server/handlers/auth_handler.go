package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"volunteer-scheduler/db"
	"volunteer-scheduler/models"
	"volunteer-scheduler/utils"
)

// Login autentica um usuário e retorna um token JWT
func Login(c *gin.Context) {
	var loginRequest models.LoginRequest

	// Validar o corpo da requisição
	if err := c.ShouldBindJSON(&loginRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados de login inválidos",
		})
		return
	}

	// Obter usuário pelo nome de usuário
	var user models.User
	err := db.DB.QueryRow(context.Background(),
		"SELECT id, username, password, name, email, role, created_at FROM users WHERE username = $1",
		loginRequest.Username).Scan(&user.ID, &user.Username, &user.Password, &user.Name, &user.Email, &user.Role, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error:   "Usuário ou senha incorretos",
		})
		return
	}

	// Verificar senha
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginRequest.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error:   "Usuário ou senha incorretos",
		})
		return
	}

	// Gerar token JWT
	token, err := utils.GenerateToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao gerar token",
		})
		return
	}

	// Remover senha da resposta
	user.Password = ""

	// Retornar resposta com token e dados do usuário
	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data: models.LoginResponse{
			Token: token,
			User:  user,
		},
	})
}

// Register cria um novo usuário
func Register(c *gin.Context) {
	var userRequest models.UserRequest

	// Validar o corpo da requisição
	if err := c.ShouldBindJSON(&userRequest); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Dados inválidos",
		})
		return
	}

	// Verificar se o nome de usuário já existe
	var exists bool
	err := db.DB.QueryRow(context.Background(),
		"SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)",
		userRequest.Username).Scan(&exists)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao verificar nome de usuário",
		})
		return
	}

	if exists {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Nome de usuário já existente",
		})
		return
	}

	// Hash da senha
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(userRequest.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao processar senha",
		})
		return
	}

	// Definir role padrão se não fornecido
	if userRequest.Role == "" {
		userRequest.Role = "volunteer"
	}

	// Inserir novo usuário
	var user models.User
	err = db.DB.QueryRow(context.Background(),
		"INSERT INTO users (username, password, name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, email, role, created_at",
		userRequest.Username, string(hashedPassword), userRequest.Name, userRequest.Email, userRequest.Role).
		Scan(&user.ID, &user.Username, &user.Name, &user.Email, &user.Role, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao criar usuário",
		})
		return
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success: true,
		Message: "Usuário criado com sucesso",
		Data:    user,
	})
}

// GetProfile retorna os dados do usuário autenticado
func GetProfile(c *gin.Context) {
	// Obter ID do usuário do contexto (definido pelo middleware de autenticação)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Success: false,
			Error:   "Não autenticado",
		})
		return
	}

	// Obter dados do usuário do banco de dados
	var user models.User
	err := db.DB.QueryRow(context.Background(),
		"SELECT id, username, name, email, role, created_at FROM users WHERE id = $1",
		userID).Scan(&user.ID, &user.Username, &user.Name, &user.Email, &user.Role, &user.CreatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Erro ao obter perfil",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    user,
	})
}