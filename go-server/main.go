package main

import (
        "fmt"
        "log"
        "os"

        "github.com/gin-gonic/gin"
        "github.com/joho/godotenv"
        "volunteer-scheduler/db"
        "volunteer-scheduler/handlers"
        "volunteer-scheduler/utils"
)

func main() {
        // Carregar variáveis de ambiente
        err := godotenv.Load()
        if err != nil {
                log.Println("Arquivo .env não encontrado, usando variáveis de ambiente do sistema")
        }

        // Inicializar conexão com o banco de dados
        err := db.InitDB()
        if err != nil {
                log.Fatalf("Erro ao inicializar o banco de dados: %v", err)
        }
        defer db.CloseDB()

        // Definir modo do Gin
        if os.Getenv("NODE_ENV") == "production" {
                gin.SetMode(gin.ReleaseMode)
        } else {
                gin.SetMode(gin.DebugMode)
        }

        // Inicializar router
        router := gin.Default()

        // Configurar CORS
        router.Use(func(c *gin.Context) {
                c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
                c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
                c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
                c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

                if c.Request.Method == "OPTIONS" {
                        c.AbortWithStatus(204)
                        return
                }

                c.Next()
        })

        // Configurar rotas
        setupRoutes(router)

        // Obter porta do ambiente ou usar padrão 5000 (mesma do Node.js)
        port := os.Getenv("PORT")
        if port == "" {
                port = "5000"
        }

        // Iniciar servidor
        fmt.Printf("Servidor Go rodando na porta %s\n", port)
        err = router.Run(":" + port)
        if err != nil {
                log.Fatalf("Erro ao iniciar servidor: %v", err)
        }
}

func setupRoutes(router *gin.Engine) {
        // Rotas públicas
        router.GET("/api/health", func(c *gin.Context) {
                c.JSON(200, gin.H{
                        "status":  "ok",
                        "message": "API Go funcionando corretamente",
                })
        })

        // Rotas de autenticação
        authRoutes := router.Group("/api/auth")
        {
                authRoutes.POST("/login", handlers.Login)
                authRoutes.POST("/register", handlers.Register)
        }

        // Rotas protegidas (temporariamente sem autenticação para transição)
        protectedRoutes := router.Group("/api")
        // TODO: Re-habilitar middleware de autenticação após a migração completa
        // protectedRoutes.Use(utils.AuthMiddleware())
        {
                // Perfil do usuário
                protectedRoutes.GET("/profile", handlers.GetProfile)
                
                // Rotas do painel
                protectedRoutes.GET("/dashboard/stats", handlers.GetDashboardStats)
                protectedRoutes.GET("/conflicts", handlers.GetConflicts)

                // Rotas de equipes
                protectedRoutes.GET("/teams", handlers.GetTeams)
                protectedRoutes.GET("/teams/:id", handlers.GetTeam)
                protectedRoutes.GET("/teams/with-roles", handlers.GetTeamsWithRoles)
                
                // Rotas de eventos
                protectedRoutes.GET("/events", handlers.GetEvents)
                protectedRoutes.GET("/events/:id", handlers.GetEvent)
                protectedRoutes.GET("/events/upcoming", handlers.GetUpcomingEvents)
                
                // Rotas de voluntários
                protectedRoutes.GET("/volunteers", handlers.GetVolunteers)
                protectedRoutes.GET("/volunteers/:id", handlers.GetVolunteer)
                protectedRoutes.GET("/volunteers/team/:teamId", handlers.GetVolunteersByTeam)
                protectedRoutes.GET("/volunteers/with-teams", handlers.GetAllVolunteersWithTeams)
                
                // Rotas de agendamentos
                protectedRoutes.GET("/schedules", handlers.GetSchedules)
                protectedRoutes.GET("/schedules/:id", handlers.GetSchedule)
                protectedRoutes.GET("/schedules/event/:eventId", handlers.GetSchedulesByEvent)
                protectedRoutes.GET("/schedules/volunteer/:volunteerId", handlers.GetSchedulesByVolunteer)
                
                // Rotas de solicitações de troca
                protectedRoutes.GET("/swap-requests", handlers.GetSwapRequests)
                protectedRoutes.GET("/swap-requests/:id", handlers.GetSwapRequest)
                protectedRoutes.POST("/swap-requests", handlers.CreateSwapRequest)
                
                // Rotas de notificações
                protectedRoutes.GET("/notifications", handlers.GetNotifications)
                protectedRoutes.GET("/notifications/unread/count", handlers.GetUnreadNotificationsCount)
                protectedRoutes.PUT("/notifications/:id/read", handlers.MarkNotificationAsRead)
                protectedRoutes.PUT("/notifications/read-all", handlers.MarkAllNotificationsAsRead)
                protectedRoutes.DELETE("/notifications/:id", handlers.DeleteNotification)
                
                // Rotas protegidas para admins/líderes (temporariamente sem verificação)
                adminRoutes := protectedRoutes.Group("")
                // TODO: Re-habilitar middleware de verificação de admin/líder após a migração completa
                // adminRoutes.Use(utils.IsAdminOrLeader())
                {
                        // Gerenciamento de equipes
                        adminRoutes.POST("/teams", handlers.CreateTeam)
                        adminRoutes.PUT("/teams/:id", handlers.UpdateTeam)
                        adminRoutes.DELETE("/teams/:id", handlers.DeleteTeam)
                        
                        // Gerenciamento de eventos
                        adminRoutes.POST("/events", handlers.CreateEvent)
                        adminRoutes.PUT("/events/:id", handlers.UpdateEvent)
                        adminRoutes.DELETE("/events/:id", handlers.DeleteEvent)
                        
                        // Gerenciamento de voluntários
                        adminRoutes.POST("/volunteers", handlers.CreateVolunteer)
                        adminRoutes.PUT("/volunteers/:id", handlers.UpdateVolunteer)
                        adminRoutes.DELETE("/volunteers/:id", handlers.DeleteVolunteer)
                        
                        // Gerenciamento de agendamentos
                        adminRoutes.POST("/schedules", handlers.CreateSchedule)
                        adminRoutes.PUT("/schedules/:id", handlers.UpdateSchedule)
                        adminRoutes.DELETE("/schedules/:id", handlers.DeleteSchedule)
                        
                        // Gerenciamento de solicitações de troca
                        adminRoutes.PUT("/swap-requests/:id/approve", handlers.ApproveSwapRequest)
                        adminRoutes.PUT("/swap-requests/:id/reject", handlers.RejectSwapRequest)
                        
                        // Gerenciamento de notificações (criar para outros usuários)
                        adminRoutes.POST("/notifications", handlers.CreateNotification)
                }
        }
}