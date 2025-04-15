package main

import (
        "flag"
        "log"
        "os"
        "strings"
)

func main() {
        // Definir flags (valores padrão podem ser substituídos via linha de comando)
        nodeJSURL := flag.String("nodejs", "http://localhost:5000", "URL do servidor Node.js")
        goURL := flag.String("go", "http://localhost:5001", "URL do servidor Go")
        goRoutesStr := flag.String("routes", "/api/health,/api/teams", "Rotas a serem direcionadas para o servidor Go (separadas por vírgula)")
        port := flag.String("port", "3000", "Porta para o proxy")
        
        // Analisar flags
        flag.Parse()
        
        // Converter string de rotas para slice
        goRoutes := strings.Split(*goRoutesStr, ",")
        
        // Também verificar variáveis de ambiente
        if envNodeJSURL := os.Getenv("PROXY_NODEJS_URL"); envNodeJSURL != "" {
                *nodeJSURL = envNodeJSURL
        }
        
        if envGoURL := os.Getenv("PROXY_GO_URL"); envGoURL != "" {
                *goURL = envGoURL
        }
        
        if envGoRoutes := os.Getenv("PROXY_GO_ROUTES"); envGoRoutes != "" {
                goRoutes = strings.Split(envGoRoutes, ",")
        }
        
        if envPort := os.Getenv("PROXY_PORT"); envPort != "" {
                *port = envPort
        }
        
        // Iniciar o proxy
        log.Printf("Iniciando proxy para Node.js (%s) e Go (%s) na porta %s", *nodeJSURL, *goURL, *port)
        log.Printf("Rotas direcionadas para Go: %v", goRoutes)
        
        err := StartProxy(*nodeJSURL, *goURL, goRoutes, *port)
        if err != nil {
                log.Fatalf("Erro ao iniciar proxy: %v", err)
        }
}