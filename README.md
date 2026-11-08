# EPDP — Estudo Profundo de Português

Plataforma educacional em desenvolvimento com React, TypeScript, Vite e Supabase.

## Executar localmente

```bash
npm install
npm run dev
```

## Configurar o Supabase

1. Crie um projeto no painel do Supabase.
2. Abra **Project Settings → API** e copie a Project URL e a chave pública **anon/publishable**.
3. No terminal do Codespaces, crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

4. Preencha `.env`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
```

5. No Supabase, abra **SQL Editor**, cole e execute o conteúdo de `supabase/schema.sql`.
6. Em **Authentication → URL Configuration**, adicione o endereço do seu Codespaces em Redirect URLs se for usar confirmação de e-mail e recuperação de senha.

**Segurança:** nunca coloque a `service_role` ou qualquer chave secreta em variáveis `VITE_*`, no navegador ou no GitHub. A chave pública anon/publishable é usada no frontend em conjunto com políticas RLS. Mantenha a confirmação de e-mail habilitada em produção.

## O que já está preparado

- Interface responsiva e navegação inicial.
- Integração de autenticação Supabase: cadastro, login, logout e solicitação de recuperação de senha.
- Contexto de sessão para reconhecer o usuário autenticado.
- Estrutura SQL inicial com perfis, aulas, progresso e tentativas de avaliação.
- Row Level Security (RLS) nas tabelas.
- Proteção para impedir que o próprio usuário altere seu papel para administrador.

## Próximas etapas

- Testar a compilação e a autenticação no ambiente do Codespaces.
- Criar e validar o perfil do estudante.
- Implementar aulas e conteúdo didático.
- Construir avaliações, reforço adaptativo e jogos funcionais.
- Criar painel administrativo com permissões controladas.

A aplicação ainda está em desenvolvimento. Não use dados reais sensíveis até concluir os testes de segurança.
