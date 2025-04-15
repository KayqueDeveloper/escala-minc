package main

import (
        "log"
        "net/http"
        "net/http/httputil"
        "net/url"
        "strings"
)

// EndpointProxy representa um proxy para um determinado endpoint
type EndpointProxy struct {
        NodeJSURL string
        GoURL     string
        GoRoutes  []string
}

// NewEndpointProxy cria um novo proxy para encaminhar solicitações
func NewEndpointProxy(nodeJSURL, goURL string, goRoutes []string) *EndpointProxy {
        return &EndpointProxy{
                NodeJSURL: nodeJSURL,
                GoURL:     goURL,
                GoRoutes:  goRoutes,
        }
}

// ServeHTTP implementa a interface http.Handler
func (e *EndpointProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
        // Determinar para qual servidor encaminhar
        useGoServer := false
        for _, route := range e.GoRoutes {
                if strings.HasPrefix(r.URL.Path, route) {
                        useGoServer = true
                        break
                }
        }

        var targetURL *url.URL
        var err error
        
        if useGoServer {
                targetURL, err = url.Parse(e.GoURL)
                log.Printf("Proxy: Encaminhando para Go: %s", r.URL.Path)
        } else {
                targetURL, err = url.Parse(e.NodeJSURL)
                log.Printf("Proxy: Encaminhando para Node.js: %s", r.URL.Path)
        }

        if err != nil {
                http.Error(w, "Erro ao configurar proxy reverso", http.StatusInternalServerError)
                log.Printf("Erro ao analisar URL de destino: %v", err)
                return
        }

        // Criar proxy reverso
        proxy := httputil.NewSingleHostReverseProxy(targetURL)
        
        // Configurar manipulador de erros
        proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
                log.Printf("Erro de proxy: %v", err)
                http.Error(w, "Erro de proxy", http.StatusBadGateway)
        }

        // Adicionar cabeçalhos
        r.URL.Host = targetURL.Host
        r.URL.Scheme = targetURL.Scheme
        r.Header.Set("X-Forwarded-Host", r.Header.Get("Host"))
        r.Host = targetURL.Host

        // Encaminhar solicitação
        proxy.ServeHTTP(w, r)
}

// StartProxy inicia o servidor proxy na porta especificada
func StartProxy(nodeJSURL, goURL string, goRoutes []string, port string) error {
        proxy := NewEndpointProxy(nodeJSURL, goURL, goRoutes)
        
        log.Printf("Iniciando proxy na porta %s", port)
        log.Printf("Node.js URL: %s", nodeJSURL)
        log.Printf("Go URL: %s", goURL)
        log.Printf("Rotas Go: %v", goRoutes)
        
        return http.ListenAndServe(":"+port, proxy)
}