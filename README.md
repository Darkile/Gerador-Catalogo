# Gerador de Catálogo Gregory

Sistema web para montar catálogos editoriais em PDF A4 com estilo Gregory Paper, usando upload de imagens, enriquecimento por IA Vision, edição comercial e exportação final.

## Acesso do sistema

- Código-fonte: GitHub (`Darkile/Gerador-Catalogo`)
- Acesso operacional: link da Vercel publicado no README deste repositório

> Atualize esta seção após o deploy com a URL final:
>
> `https://gerador-catalogo-darkile.vercel.app`

## Stack implementada

- Frontend: Next.js 14 (App Router), React 18, TypeScript
- UI: Tailwind CSS, componentes no estilo shadcn/ui, React Dropzone, React Hook Form, Zustand
- Backend: Next.js API Routes (Node.js runtime)
- Banco e storage: Supabase PostgreSQL + Supabase Storage
- IA Vision: OpenAI `gpt-4o` com JSON Schema strict, timeout 30s e retry 2x
- Fila: BullMQ + Redis (Upstash)
- PDF: Puppeteer Core + template editorial A4

## Funcionalidades entregues

- `/upload`
  - Drag & drop (JPG/PNG)
  - Limites: até 5MB por arquivo, até 50 arquivos
  - Preview em grid com numeração
  - Remover/reordenar
  - Upload para Supabase Storage com barra de progresso
- `/editor`
  - Edição por produto: SKU, tipo, descrição, preço original, desconto, preço final calculado, tamanhos
  - Botão `Processar com IA` com fila assíncrona e polling de status
  - Botão `Visualizar PDF` (modal HTML)
  - Botão `Gerar PDF` com download direto
- Backend/API
  - `POST /api/process-image` (enqueue)
  - `GET /api/process-image?jobId=...` (status)
  - `POST /api/generate-pdf`
  - `GET /api/catalogs/:id`
  - `POST /api/catalogs`
  - `PUT /api/catalogs/:id/products`
- Style extractor
  - `agents/style-extractor/extract-style.ts`
  - Saída: `design/gregory-design-tokens.json` + `design/gregory-design-tokens.css`

## Estrutura principal

- `app/(dashboard)/upload/page.tsx`
- `app/(dashboard)/editor/page.tsx`
- `app/api/process-image/route.ts`
- `app/api/generate-pdf/route.ts`
- `lib/pdf/catalog-template.ts`
- `agents/style-extractor/extract-style.ts`
- `stores/catalog-store.ts`
- `supabase/migrations/202604170001_init_catalog_schema.sql`

## Pré-requisitos

- Node 20+
- Projeto Supabase criado
- Redis (Upstash) para BullMQ
- Chave OpenAI com acesso ao modelo Vision
- Navegador Chromium disponível para `puppeteer-core` em desenvolvimento local

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Crie `.env.local` a partir de `.env.example` e preencha as variáveis.

3. Rode a migration SQL no Supabase:

- `supabase/migrations/202604170001_init_catalog_schema.sql`

4. Crie um usuário em `Auth > Users` no Supabase para login da operadora.

## Execução

Desenvolvimento web:

```bash
npm run dev
```

Worker de IA (processamento de fila):

```bash
npm run worker:ai
```

Extração de estilo do PDF de referência:

```bash
npm run extract:style -- --input="./Exemplos/Revista Inverno 2026_1776266245778 (1).pdf"
```

## Build e validações

```bash
npm run typecheck
npm run lint
npm run build
```

## Deploy (GitHub + Vercel)

1. Suba o código para `main` no GitHub.
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente da `.env.example` no projeto Vercel.
4. Configure bucket/policies no Supabase via migration.
5. Após o primeiro deploy, copie a URL da Vercel e publique no topo deste README.

## Checklist de Variáveis (Produção)

Status atual do projeto `gerador-catalogo-darkile`:

- `NEXT_PUBLIC_SUPABASE_URL`: configurada
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: configurada
- `SUPABASE_SERVICE_ROLE_KEY`: configurada
- `REDIS_URL` (Upstash): configurada
- `NEXT_PUBLIC_APP_URL`: configurada
- `NEXT_PUBLIC_IMAGE_BUCKET_NAME`: configurada
- `IMAGE_BUCKET_NAME`: configurada
- `PDF_BUCKET_NAME`: configurada
- `OPENAI_VISION_MODEL`: configurada (`gpt-4o`)
- `AI_WORKER_CONCURRENCY`: configurada (`2`)
- `OPENAI_API_KEY`: pendente (opcional para fallback, obrigatório para descrição real com IA)

Sem `OPENAI_API_KEY`, o pipeline continua funcional com descrição de fallback.

## Observações operacionais

- O GitHub hospeda o código, não o runtime da aplicação.
- O acesso da operadora deve ser pelo link da Vercel.
- O histórico de catálogos e PDFs é persistido no Supabase.
- Canva está fora de escopo da v1.
