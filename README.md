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

## Estado da EPDP GAME ARENA

A central reúne 20 jogos de português com seis desafios por partida (120 desafios no total). Cada jogo tem uma identidade de cenário e utiliza um motor de interação adequado ao desafio: tabuleiro de letras, forca, peças de ortografia, sílabas, ordenação de frases, sequência, associação por arrastar/soltar ou toque, interpretação e perguntas de gramática.

### Experiência de jogo
- Sessões em tela imersiva, com controles grandes, resposta visual imediata, transições entre fases e animações de vitória.
- Coruja mascote com estados visuais de pensamento, acerto, erro e comemoração.
- Música de fundo procedural com Web Audio durante a partida; efeitos diferentes para início, acerto, erro, troca de fase, recompensa e conclusão. O botão de som permite silenciar.
- Vibração tátil com `navigator.vibrate` em navegadores/dispositivos que oferecem suporte. A vibração não é garantida em todos os aparelhos, especialmente em navegadores iOS.
- Layout responsivo com controles de toque e alternativas por clique/teclado; suporte a `prefers-reduced-motion`.

### Progressão e dados
- Para usuários autenticados, o Supabase valida as seis respostas no servidor e calcula a pontuação; a aplicação não envia uma pontuação escolhida pelo navegador.
- Histórico de partidas, XP acumulado, moedas, total de partidas, melhor pontuação e conquistas são persistidos no Supabase.
- Conquistas novas aparecem em uma celebração em tela cheia, com recompensas e sequência para múltiplas conquistas.
- Os jogos são desbloqueados progressivamente por XP. Visitantes podem jogar, mas seus resultados não são gravados.
- Os gabaritos ficam em um esquema privado do banco, sem leitura direta pelo cliente.

### Verificações automatizadas
- `npm run test:games`: verifica os 20 jogos, as 120 fases, respostas, peças de montagem, caminhos do caça-palavras, breakpoints móveis, áudio e vibração.
- `npm run build`: verifica TypeScript e gera a versão de produção.
- O GitHub Actions executa os dois comandos em cada atualização da branch principal.

Os testes automatizados verificam dados, estrutura e compilação. Eles não substituem testes manuais em aparelhos físicos, navegadores diferentes, permissões de áudio/vibração ou testes completos de ponta a ponta. Antes de produção, valide esses fluxos em celulares e computadores reais, além das políticas RLS e da instalação PWA.


## Avaliações e reforço

- As avaliações publicadas são carregadas do Supabase.
- O envio das respostas é feito pela função PostgreSQL `submit_assessment`; a nota é calculada no banco e o gabarito não é exposto na consulta de alternativas.
- O retorno inclui a correção comentada e os conceitos de cada questão.
- A avaliação diagnóstica inicial possui cinco questões autorais.
- Quando o aproveitamento de um assunto fica abaixo de 70%, a função registra uma recomendação individual na tabela `study_recommendations`.
- As vinte modalidades registram as partidas por meio de `record_game_attempt` quando o estudante está autenticado. Visitantes podem jogar, mas não salvam recordes.

As recomendações são criadas a partir de tentativas reais. O catálogo de aulas de reforço ainda precisa ser ampliado. O progresso de jogos salvo hoje registra tentativas e pontuação; a persistência de XP, medalhas e desbloqueio de fases ainda precisa ser desenvolvida.
