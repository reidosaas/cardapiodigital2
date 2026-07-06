# CardapioDigital - SaaS de Cardapio Digital e Catalogo Online

Sistema SaaS completo de cardapio digital e catalogo online com vendas automatizadas via WhatsApp, multi-empresa (multi-tenant), IA de atendimento e painel administrativo.

## Tecnologias

### Frontend
- **Next.js 14** (App Router)
- **React 18** com TypeScript
- **TailwindCSS** para estilizacao
- **ShadCN UI** + Radix UI para componentes
- **Framer Motion** para animacoes
- **Recharts** para graficos
- **Zustand** para estado global
- **Sonner** para notificacoes toast

### Backend
- **NestJS** (Node.js + TypeScript)
- **Prisma ORM** com PostgreSQL
- **JWT + Refresh Token** autenticacao
- **Socket.IO** para chat em tempo real
- **Swagger** documentacao da API
- **Throttler** rate limiting
- **Helmet** seguranca

### Infraestrutura
- **Docker** e Docker Compose
- **PostgreSQL** banco de dados
- **Redis** cache/filas
- **Nginx** proxy reverso
- **PM2** gerenciamento de processos

## Estrutura do Projeto

```
cardapio-digital/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/             # Configuracoes
│   │   ├── prisma/             # Prisma service + seed
│   │   ├── common/             # Guards, decorators, filters
│   │   └── modules/            # Modulos do sistema
│   │       ├── auth/           # Autenticacao (JWT)
│   │       ├── users/          # Usuarios
│   │       ├── vendedores/     # Vendedores (tenants)
│   │       ├── produtos/       # Produtos
│   │       ├── categorias/     # Categorias
│   │       ├── pedidos/        # Pedidos
│   │       ├── pagamentos/     # Pagamentos PIX/Cartao
│   │       ├── clientes/       # Clientes
│   │       ├── whatsapp/       # Integracao WhatsApp
│   │       ├── chat/           # Chat em tempo real
│   │       ├── agendamentos/   # Agenda
│   │       ├── financeiro/     # Financeiro
│   │       ├── notificacoes/   # Notificacoes
│   │       ├── cupons/         # Cupons de desconto
│   │       ├── entregas/       # Entregas
│   │       ├── banners/        # Banners
│   │       ├── avaliacoes/     # Avaliacoes
│   │       ├── assinaturas/    # Planos/assinaturas
│   │       ├── relatorios/     # Relatorios
│   │       ├── upload/         # Upload imagens
│   │       ├── webhooks/       # Webhooks
│   │       └── logs/           # Logs auditoria
│   └── prisma/
│       └── schema.prisma       # Schema completo
├── frontend/                   # Next.js App
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── auth/           # Login/Register
│   │   │   ├── admin/          # Dashboard admin
│   │   │   ├── dashboard/      # Painel vendedor
│   │   │   └── catalogo/       # Catalogo publico
│   │   ├── components/
│   │   │   ├── ui/             # Componentes base
│   │   │   ├── layout/         # Sidebar, navbar
│   │   │   ├── shared/         # Shared components
│   │   │   ├── catalogo/       # Componentes do catalogo
│   │   │   ├── dashboard/      # Componentes dashboard
│   │   │   └── graficos/       # Graficos
│   │   ├── lib/                # Utilitarios
│   │   ├── hooks/              # Hooks customizados
│   │   └── styles/             # Estilos globais
│   └── public/
└── docker/                     # Docker configs
```

## Instalacao e Execucao

### Requisitos
- Node.js 20+
- Docker e Docker Compose
- PostgreSQL (ou use o container)

### Desenvolvimento

```bash
# Clone o repositorio
cd cardapio-digital

# Instale as dependencias
cd backend && npm install
cd ../frontend && npm install
cd ..

# Configure as variaveis de ambiente
cp .env.example .env

# Inicie os containers (PostgreSQL + Redis)
docker-compose up -d postgres redis

# Execute as migracoes
npm run db:migrate

# Popule o banco com dados iniciais
npm run db:seed

# Inicie o desenvolvimento
npm run dev
```

### Producao

```bash
# Configure as variaveis
cp .env.example .env
# Edite o .env com as configuracoes de producao

# Build e deploy
npm run deploy
```

## Acesso

### Admin Master
- Email: admin@cardapio.digital
- Senha: admin123

### Documentacao da API
- Swagger: http://localhost:3001/api/docs

## Funcionalidades

### Multi-Tenant
- Cada vendedor tem seu proprio catalogo
- Subdominio automatico (vendedor.sistema.com)
- Dominio personalizado opcional
- QR Code unico por catalogo

### Catalogo Digital
- Layout responsivo e moderno
- Modo escuro
- Busca inteligente
- Categorias e banners
- Produtos com imagens, variacoes e estoque
- Carrinho de compras
- Checkout via WhatsApp

### WhatsApp + IA
- Conexao via QR Code (Evolution API)
- Chat em tempo real com Socket.IO
- Mensagens automaticas configurativas
- Chatbot com OpenAI
- Historico completo de conversas
- Disparo automatico de mensagens

### Pedidos
- Criacao automatica via WhatsApp
- Acompanhamento em tempo real
- Notificacoes push
- Status atualizavel
- Historico completo

### Financeiro
- Pagamentos PIX
- Link de pagamento
- Extrato detalhado
- Metodos de pagamento
- Comissoes e assinaturas

### Dashboard
- Metricas em tempo real
- Graficos de vendas
- Produtos mais vendidos
- Relatorios por periodo
- Dashboard admin global

## Seguranca
- Autenticacao JWT com refresh token
- Rate limiting (Throttler)
- Helmet headers de seguranca
- Validacao de dados (class-validator)
- Criptografia de senhas (bcrypt)
- Protecao contra SQL injection (Prisma)
- Auditoria (logs)

## License
MIT
