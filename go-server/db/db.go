package db

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v4/pgxpool"
)

var DB *pgxpool.Pool

// InitDB inicializa a conexão com o banco de dados PostgreSQL
func InitDB() {
	// Obter a string de conexão do ambiente
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("Variável de ambiente DATABASE_URL não definida")
	}

	var err error
	
	// Configurar o pool de conexões
	config, err := pgxpool.ParseConfig(dbURL)
	if err != nil {
		log.Fatalf("Erro ao configurar conexão com o banco de dados: %v", err)
	}

	// Definir o tamanho máximo do pool de conexões
	config.MaxConns = 10

	// Criar o pool de conexões
	DB, err = pgxpool.ConnectConfig(context.Background(), config)
	if err != nil {
		log.Fatalf("Erro ao conectar com o banco de dados: %v", err)
	}

	// Verificar a conexão
	err = DB.Ping(context.Background())
	if err != nil {
		log.Fatalf("Erro ao verificar conexão com o banco de dados: %v", err)
	}

	fmt.Println("Conexão com o banco de dados estabelecida com sucesso")
}

// CloseDB fecha a conexão com o banco de dados
func CloseDB() {
	if DB != nil {
		DB.Close()
		fmt.Println("Conexão com o banco de dados fechada")
	}
}