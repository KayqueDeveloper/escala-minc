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
        db.InitDB()
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

        // Obter porta do ambiente ou usar padrão 5000
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

        // Rotas protegidas (requerem autenticação)
        protectedRoutes := router.Group("/api")
        protectedRoutes.Use(utils.AuthMiddleware())
        {
                // Perfil do usuário
                protectedRoutes.GET("/profile", handlers.GetProfile)

                // Rotas de equipes
                protectedRoutes.GET("/teams", handlers.GetTeams)
                protectedRoutes.GET("/teams/:id", handlers.GetTeam)
                protectedRoutes.GET("/teams/with-roles", handlers.GetTeamsWithRoles)
                
                // Rotas protegidas para admins/líderes
                adminRoutes := protectedRoutes.Group("")
                adminRoutes.Use(utils.IsAdminOrLeader())
                {
                        adminRoutes.POST("/teams", handlers.CreateTeam)
                        adminRoutes.PUT("/teams/:id", handlers.UpdateTeam)
                        adminRoutes.DELETE("/teams/:id", handlers.DeleteTeam)
                }
        }
}