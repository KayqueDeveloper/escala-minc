package config

import (
	"os"
	"strconv"
)

// Config contém todas as configurações do aplicativo
type Config struct {
	ServerPort      string
	DatabaseURL     string
	JWTSecret       string
	Environment     string
	LogLevel        string
	MigrationPhase  bool
	MigratedRoutes  []string
	AllowCORS       bool
	NodeJSProxyPath string
}

// LoadConfig carrega a configuração a partir de variáveis de ambiente
func LoadConfig() Config {
	config := Config{
		ServerPort:      getEnv("PORT", "5001"),
		DatabaseURL:     getEnv("DATABASE_URL", ""),
		JWTSecret:       getEnv("JWT_SECRET", "volunteer-scheduler-secret"),
		Environment:     getEnv("GO_ENV", "development"),
		LogLevel:        getEnv("LOG_LEVEL", "info"),
		MigrationPhase:  getEnvAsBool("MIGRATION_PHASE", true),
		AllowCORS:       getEnvAsBool("ALLOW_CORS", true),
		NodeJSProxyPath: getEnv("NODEJS_PROXY_URL", "http://localhost:5000"),
	}

	// Definir rotas migradas padrão
	config.MigratedRoutes = []string{
		"/api/health",
		"/api/teams",
		"/api/roles",
		"/api/volunteers",
		"/api/events",
		"/api/schedules",
		"/api/swap-requests",
		"/api/notifications",
	}

	// Substituir rotas migradas se definido em variável de ambiente
	if routes := getEnv("MIGRATED_ROUTES", ""); routes != "" {
		// Poderia implementar a divisão da string aqui
		// config.MigratedRoutes = strings.Split(routes, ",")
	}

	return config
}

// getEnv recupera uma variável de ambiente ou retorna um valor padrão
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

// getEnvAsBool recupera uma variável de ambiente como booleano
func getEnvAsBool(key string, defaultValue bool) bool {
	if valueStr, exists := os.LookupEnv(key); exists {
		value, err := strconv.ParseBool(valueStr)
		if err == nil {
			return value
		}
	}
	return defaultValue
}

// getEnvAsInt recupera uma variável de ambiente como inteiro
func getEnvAsInt(key string, defaultValue int) int {
	if valueStr, exists := os.LookupEnv(key); exists {
		value, err := strconv.Atoi(valueStr)
		if err == nil {
			return value
		}
	}
	return defaultValue
}