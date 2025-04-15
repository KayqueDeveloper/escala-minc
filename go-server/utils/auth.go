package utils

import (
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"volunteer-scheduler/models"
)

// Claims estrutura para o token JWT
type Claims struct {
	UserID int    `json:"userId"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken cria um novo token JWT para o usuário
func GenerateToken(user models.User) (string, error) {
	// Tempo de expiração do token
	expirationHours := 24
	if os.Getenv("JWT_EXPIRATION_HOURS") != "" {
		var err error
		expirationHours, err = strconv.Atoi(os.Getenv("JWT_EXPIRATION_HOURS"))
		if err != nil {
			expirationHours = 24
		}
	}

	// Chave secreta para assinatura do token
	secretKey := getSecretKey()

	// Criar claims
	claims := &Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * time.Duration(expirationHours))),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "volunteer-scheduler",
			Subject:   strconv.Itoa(user.ID),
		},
	}

	// Criar token com o método de assinatura HS256
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Assinar token com a chave secreta
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateToken valida um token JWT
func ValidateToken(tokenString string) (*Claims, error) {
	// Chave secreta para validação do token
	secretKey := getSecretKey()

	// Parsear token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Verificar que o método de assinatura está correto
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("método de assinatura inválido")
		}
		return []byte(secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	// Verificar se o token é válido
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("token inválido")
}

// AuthMiddleware middleware para autenticação
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Obter token do cabeçalho Authorization
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(401, gin.H{"error": "token não fornecido"})
			c.Abort()
			return
		}

		// Remover "Bearer " do token se presente
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		// Validar token
		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(401, gin.H{"error": "token inválido"})
			c.Abort()
			return
		}

		// Adicionar claims ao contexto
		c.Set("userID", claims.UserID)
		c.Set("userRole", claims.Role)

		c.Next()
	}
}

// IsAdmin middleware para verificar se o usuário é administrador
func IsAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists {
			c.JSON(401, gin.H{"error": "não autenticado"})
			c.Abort()
			return
		}

		if role != "admin" {
			c.JSON(403, gin.H{"error": "acesso negado"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// IsAdminOrLeader middleware para verificar se o usuário é administrador ou líder
func IsAdminOrLeader() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists {
			c.JSON(401, gin.H{"error": "não autenticado"})
			c.Abort()
			return
		}

		if role != "admin" && role != "leader" {
			c.JSON(403, gin.H{"error": "acesso negado"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// getSecretKey obtém a chave secreta para JWT
func getSecretKey() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Em produção, isso deve ser uma chave segura configurada via variável de ambiente
		return "volunteer-scheduler-secret-key"
	}
	return secret
}