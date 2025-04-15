package main

import (
        "log"
        "net/http"
        "net/http/httptest"

        "github.com/gin-gonic/gin"
        "volunteer-scheduler/db"
        "volunteer-scheduler/handlers"
)

// TestHandlers verifica se os handlers estão implementados corretamente
func TestHandlers() {
        // Inicializar o router Gin
        gin.SetMode(gin.TestMode)
        router := gin.New()
        
        // Configurar rotas de teste
        router.GET("/api/health", func(c *gin.Context) {
                c.JSON(http.StatusOK, gin.H{
                        "status": "ok",
                        "message": "API Go funcionando corretamente",
                })
        })
        
        router.GET("/api/teams", handlers.GetTeams)
        router.GET("/api/events", handlers.GetEvents)
        router.GET("/api/volunteers", handlers.GetVolunteers)
        router.GET("/api/schedules", handlers.GetSchedules)
        router.GET("/api/swap-requests", handlers.GetSwapRequests)
        router.GET("/api/notifications", handlers.GetNotifications)
        router.GET("/api/dashboard/stats", handlers.GetDashboardStats)
        
        // Verificar cada endpoint
        endpoints := []string{
                "/api/health",
                "/api/teams",
                "/api/events",
                "/api/volunteers",
                "/api/schedules",
                "/api/swap-requests",
                "/api/notifications",
                "/api/dashboard/stats",
        }
        
        log.Println("Iniciando testes dos handlers...")
        
        // Testar cada endpoint
        for _, endpoint := range endpoints {
                req, _ := http.NewRequest("GET", endpoint, nil)
                w := httptest.NewRecorder()
                router.ServeHTTP(w, req)
                
                statusCode := w.Code
                log.Printf("Endpoint %s: Status Code %d", endpoint, statusCode)
                
                // Considerar 401 (Unauthorized) como sucesso para endpoints que requerem autenticação
                if statusCode != http.StatusOK && statusCode != http.StatusUnauthorized {
                        log.Printf("FALHA: Endpoint %s retornou código inesperado: %d", endpoint, statusCode)
                } else {
                        log.Printf("SUCESSO: Endpoint %s responde como esperado", endpoint)
                }
        }
        
        log.Println("Testes dos handlers concluídos")
}

func main() {
        // Inicializar conexão com o banco de dados (necessário para handlers que interagem com o banco)
        err := db.InitDB()
        if err != nil {
                log.Fatalf("Erro ao inicializar o banco de dados: %v", err)
        }
        defer db.CloseDB()
        
        // Executar testes
        TestHandlers()
}