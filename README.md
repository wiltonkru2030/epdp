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


## PWA — instalação no celular

O projeto possui manifesto web, ícone vetorial e service worker registrados somente na versão de produção.

- O service worker mantém apenas o shell público e arquivos estáticos da aplicação.
- Requisições de autenticação, API e Storage não são armazenadas em cache.
- A navegação pode abrir a estrutura da aplicação sem rede, mas login, progresso, avaliações e conteúdos servidos pelo Supabase dependem de conexão.
- Para testar a instalação, publique o site em HTTPS e abra-o em um navegador compatível. O endereço de desenvolvimento não representa a validação final de instalação.

## Estado de implementação

A central de jogos possui quatro modalidades jogáveis: forca de palavras, complete a palavra, monte a frase e desafio de acentuação. As partidas incluem teclado interativo na forca, seleção/ordenação de palavras, feedback explicado, cronômetro de 90 segundos e pontuação. Para usuários autenticados, os resultados são enviados à função `record_game_attempt` e ficam no histórico de `game_attempts`. O catálogo solicitado de 20 jogos ainda não está completo; caça-palavras, jogos de classes gramaticais, verbos, pontuação, concordância e batalha de conhecimentos ainda precisam ser implementados.

Antes de produção, validar o build, os fluxos de autenticação, as rotas, as políticas RLS e a instalação PWA em dispositivos reais.


## Avaliações e reforço

- As avaliações publicadas são carregadas do Supabase.
- O envio das respostas é feito pela função PostgreSQL `submit_assessment`; a nota é calculada no banco e o gabarito não é exposto na consulta de alternativas.
- O retorno inclui a correção comentada e os conceitos de cada questão.
- A avaliação diagnóstica inicial possui cinco questões autorais.
- Quando o aproveitamento de um assunto fica abaixo de 70%, a função registra uma recomendação individual na tabela `study_recommendations`.
- As quatro modalidades atuais registram as rodadas por meio de `record_game_attempt` quando o estudante está autenticado. Visitantes podem jogar, mas não salvam recordes.

As recomendações são criadas a partir de tentativas reais. O catálogo de aulas de reforço e os demais jogos ainda precisam ser ampliados.
