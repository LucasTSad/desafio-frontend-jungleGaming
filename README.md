# Kurio — NFT Marketplace

Marketplace de NFTs do [desafio frontend](docs/desafio.md): catálogo, detalhe, carrinho, pagamento com carteira simulada, pedidos e conta do colecionador, em desktop e mobile. A API REST e o Socket.IO são simulados no navegador com MSW. Não há backend real, e a versão publicada roda com a mesma camada de mocks.

- **Aplicação publicada:** https://kurio-nft-marketplace-ashy.vercel.app
- **Arquitetura, decisões e desvios do Figma:** [ARCHITECTURE.md](ARCHITECTURE.md)
- **Contratos REST e eventos:** [docs/contratos-api.md](docs/contratos-api.md)
- **Testes E2E:** [docs/testes-e2e.md](docs/testes-e2e.md)
- **Lighthouse:** [docs/lighthouse.md](docs/lighthouse.md) e [ntf-project/lighthouse/RESULTADOS.md](ntf-project/lighthouse/RESULTADOS.md)

## Stack

React 19, TypeScript, Vite 8, TanStack Router e Query, Axios, Socket.IO (`socket.io-client`), Tailwind CSS 4, shadcn/ui (Radix), react-hook-form e zod, MSW 2 com `@mswjs/socket.io-binding`, Playwright com `@axe-core/playwright` e Lighthouse 13.

## Setup

Requisitos: Node.js 22.19 ou mais recente (exigência do Lighthouse; o restante roda a partir do Node 20.19) e npm. O desenvolvimento foi feito com Node 25.8 e npm 11 no Windows 11.

O app fica em `ntf-project/`; todos os comandos abaixo rodam nessa pasta.

```bash
cd ntf-project
npm ci
npx playwright install chromium
npm run dev
```

O `npx playwright install chromium` baixa o navegador usado pelos testes e pela auditoria do Lighthouse. O `npm run dev` abre o app em `http://localhost:5173` com a API simulada ligada.

## Variáveis de ambiente

O arquivo `ntf-project/.env` já vem versionado com os valores da demonstração, e o `ntf-project/.env.example` repete os mesmos valores como modelo. Para mudar algo só na sua máquina, crie um `.env.local` (ignorado pelo Git).

| Variável | Valor padrão | Para que serve |
| --- | --- | --- |
| `VITE_API_MOCKING` | `enabled` | Liga a API simulada (MSW) no desenvolvimento e no build. Com outro valor, o app chama `VITE_API_URL` de verdade. |
| `VITE_API_URL` | `/api/v1` | Base da API REST usada pelo Axios. |
| `VITE_SOCKET_URL` | vazio | Origem do Socket.IO. Vazia, usa a origem da página, onde o MSW intercepta a conexão. |

O build publicado usa o mesmo `.env`, então a demonstração na Vercel também roda com os mocks.

## Contas de demonstração

As contas são fictícias. O banco simulado guarda só o hash da senha (SHA-256 com salt), em [src/mocks/fixtures/users.ts](ntf-project/src/mocks/fixtures/users.ts). As senhas ficam aqui e nas fixtures dos testes ([tests/fixtures/accounts.ts](ntf-project/tests/fixtures/accounts.ts)).

| Conta | E-mail | Senha | Estado inicial |
| --- | --- | --- | --- |
| Colecionador | `colecionador@kurio.dev` | `Kurio2026` | Carteiras principal (Ethereum) e reserva (Polygon), 2 favoritos e 3 itens no carrinho |
| Curadora | `curadora@kurio.dev` | `Curadoria2026` | Sem carteiras, favoritos ou carrinho |

Também é possível criar uma conta nova em "Criar conta". Cadastrar o e-mail ou o usuário de uma conta existente mostra o erro de conflito.

| Cupom | Resultado |
| --- | --- |
| `KURIO10` | 10% de desconto |
| `GENESIS` | Recusado como vencido |
| qualquer outro | Recusado como inválido |

## Cenários da API simulada

Os dados simulados (catálogo, contas, carrinhos, favoritos, carteiras e pedidos) ficam no `localStorage` do navegador. Eles sobrevivem ao refresh e são compartilhados entre as abas. Cada navegador tem o seu próprio banco simulado.

### Seleção e reset

- **Painel "API simulada":** botão no canto inferior esquerdo com o nome do cenário ativo. Ele abre um seletor com a descrição de cada cenário e dois botões:
  - **Aplicar cenário:** troca o cenário e recarrega a página;
  - **Restaurar dados:** volta às fixtures com o cenário selecionado, apaga os dados do app no navegador (sessão e carrinho do visitante) e recarrega a página.
- **Pela URL:** `?cenario=<id>` em qualquer página ativa o cenário. Exemplo: `http://localhost:5173/?cenario=lento`. O cenário fica guardado até ser trocado.
- **Pelo console** (usado pelos testes): `window.__kurioMock`.

| Comando no console | O que faz |
| --- | --- |
| `__kurioMock.reset({ scenario: 'padrao' })` | Restaura as fixtures, limpa os dados do app no navegador e aplica o cenário |
| `__kurioMock.setScenario('lento')` | Troca o cenário (recarregue a página para começar do zero) |
| `__kurioMock.updateNft('emerald-ape-042', { priceEth: '1.50' })` | Muda o preço de um NFT, como faria uma venda no backend; sai um `nft.updated` |
| `__kurioMock.updateNft('ivory-baron-088', { editions: { aberta: 0 } })` | Esgota uma edição |
| `__kurioMock.setRealtimeOnline(false)` | Derruba o servidor de eventos; `true` religa |
| `__kurioMock.disconnectWallet()` | A carteira simulada encerra as conexões abertas (`wallet.disconnected`) |
| `__kurioMock.advanceClock(31 * 60_000)` | Avança o relógio do mock (ex.: vence a sessão de 30 min) |

### Cenários disponíveis

| Id | Nome no painel | Comportamento |
| --- | --- | --- |
| `padrao` | Padrão | Tudo funciona, com latência de 120 a 400 ms |
| `vazio` | Catálogo vazio | Busca, "Mais desta coleção" e recomendações voltam vazias |
| `lento` | Rede lenta | Respostas entre 1,5 e 3 s |
| `fora-de-ordem` | Respostas fora de ordem | Latência entre 50 ms e 2,5 s |
| `offline` | Sem conexão | Todas as chamadas falham por falta de conexão |
| `erro-servidor` | Erro no servidor | Todas as chamadas respondem 503 |
| `instavel` | Instável | Cada requisição falha 3 vezes e funciona na 4ª |
| `sessao-expirada` | Sessão expirada | Sessões abertas antes da ativação respondem que expiraram |
| `cupom-expirado` | Cupom expirado | Os cupons existentes são recusados como vencidos |
| `preco-alterado` | Preço alterado | O preço do primeiro item do carrinho muda na confirmação da compra |
| `edicao-esgotada` | Edição esgotada | A edição do primeiro item do carrinho esgota na confirmação da compra |
| `carteira-recusada` | Carteira recusa a conexão | A primeira conexão com a carteira é recusada |
| `timeout-pedido` | Timeout no pedido | O pedido é criado e a primeira resposta se perde |
| `pagamento-recusado` | Pagamento recusado | Os pedidos criados com o cenário ativo são recusados |
| `eventos-duplicados` | Eventos duplicados | Cada evento chega de novo 150 ms depois, seguido do evento anterior do mesmo recurso |

As latências saem de um gerador com semente fixa, então a mesma sequência de requisições se repete a cada ativação. Os efeitos únicos (preço alterado, edição esgotada, carteira recusada e timeout) valem uma vez por ativação, mesmo depois de recarregar a página.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com a API simulada (porta 5173) |
| `npm run build` | Verificação de tipos e build de produção em `dist/` |
| `npm run preview` | Serve o `dist/` (porta 4173), como na publicação |
| `npm run typecheck` | Só a verificação de tipos (`tsc -b`) |
| `npm run lint` | oxlint |
| `npm run format` / `npm run format:check` | Prettier |
| `npm test` | Suíte completa do Playwright: unidade, E2E desktop e E2E mobile |
| `npm run test:unit` | Só os testes sem navegador (contratos e valores em ETH) |
| `npm run test:e2e` | Só os E2E, nos dois viewports |
| `npm run test:visual` | Só a regressão visual |
| `npm run test:visual:update` | Regrava as baselines depois de uma mudança visual intencional |
| `npm run test:report` | Abre o relatório HTML da última execução |
| `npm run lighthouse` | Build e auditoria do início e do detalhe (mobile e desktop, 3 medições cada) |
| `npm run images` | Regera as imagens otimizadas dos NFTs a partir de `assets-src/` |

Os testes sobem o build com `vite preview` na porta 4173. Se já houver um preview aberto nessa porta, o Playwright o reaproveita. Nesse caso, rode `npm run build` antes, para os testes não usarem um `dist/` antigo. Falhas guardam screenshot e trace em `test-results/`; abra com `npx playwright show-trace <arquivo>` ou pelo `npm run test:report`.

A regressão visual tem baselines geradas no Windows. Em outro sistema operacional, gere as baselines dele com `npm run test:visual:update` antes de comparar (detalhes em [docs/testes-e2e.md](docs/testes-e2e.md)).

## Como reproduzir os fluxos de falha

Use o painel "API simulada" ou `?cenario=<id>` na URL. Para começar do zero, use "Restaurar dados". Quando o roteiro diz "entre", use a conta Colecionador, que já tem carrinho e carteiras.

| Fluxo | Como reproduzir | O que esperar |
| --- | --- | --- |
| Carregamento lento | Cenário `lento` e abra o início, um NFT ou o carrinho | Skeletons com shimmer nas mesmas dimensões do conteúdo. Com movimento reduzido no sistema, o shimmer para |
| Falha e nova tentativa | Cenário `instavel` e abra o início | As consultas tentam 3 vezes e mostram o erro; "Tentar novamente" faz a 4ª tentativa, que funciona |
| Sem conexão ou 503 | Cenário `offline` ou `erro-servidor` | Mensagens de erro com "Tentar novamente"; nada aparenta sucesso |
| Respostas fora de ordem | Cenário `fora-de-ordem` e troque filtros, abas ou páginas em sequência | A lista sempre corresponde aos filtros da URL, nunca a uma resposta atrasada |
| Resultado vazio | Cenário `vazio` | "Nenhum NFT encontrado" no catálogo |
| NFT inexistente | Abra `/nft/nao-existe` | Tela de NFT não encontrado |
| Sessão expirada | Entre, abra uma tela privada (ex.: `/conta/perfil`) e ative `sessao-expirada` pelo painel. Outra forma: rode `__kurioMock.advanceClock(31 * 60_000)` e navegue | Aviso "Sua sessão expirou", ida para Entrar e volta à mesma tela depois do login |
| Conflito de cadastro | Crie uma conta com `colecionador@kurio.dev` ou o usuário `colecionador` | Erro no campo correspondente |
| Favorito que falha | Entre, abra o início, rode `__kurioMock.setScenario('erro-servidor')` no console (sem recarregar) e toque num coração | O coração muda na hora, volta ao estado anterior e um aviso explica a falha |
| Cupom inválido ou vencido | No carrinho, aplique `XYZ` ou `GENESIS` (ou ative `cupom-expirado` e use `KURIO10`) | Mensagem da API no campo do cupom |
| Preço ou estoque muda com o carrinho aberto | Com o carrinho aberto, rode `__kurioMock.updateNft('emerald-ape-042', { priceEth: '1.50' })` ou esgote uma edição | Aviso no carrinho e na live region, resumo atualizado e checkout bloqueado até aceitar o preço ou remover o item |
| Preço alterado ou edição esgotada no checkout | Entre, ative `preco-alterado` ou `edicao-esgotada`, vá ao pagamento, "Confirmar compra" e depois "Confirmar e pagar" | "O total mudou" pede nova confirmação; edição esgotada bloqueia a compra |
| Carteira recusa | Ative `carteira-recusada` e confirme a compra | A primeira conexão é recusada; a nova tentativa conecta |
| Carteira desconectada | Ative `preco-alterado` e confirme a compra. Quando aparecer "O total mudou", rode `__kurioMock.disconnectWallet()` | Aviso de carteira desconectada; "Confirmar novo total" conecta de novo e conclui o pedido |
| Timeout no pedido | Ative `timeout-pedido` e confirme a compra | O reenvio com a mesma chave de idempotência recupera o mesmo pedido, sem duplicar |
| Pagamento recusado | Ative `pagamento-recusado` e confirme a compra | Pedido recusado; os itens continuam no carrinho |
| Pedido pendente sem socket | Rode `__kurioMock.setRealtimeOnline(false)`, confirme a compra e recarregue a página do pedido | O pedido segue pendente e é confirmado pela consulta à API, sem nova compra. O pagamento mostra "Acompanhar o pedido" enquanto houver um pendente |
| Eventos duplicados e antigos | Ative `eventos-duplicados` e mude um preço pelo console | O preço não volta ao valor anterior e o aviso não se repete |

## Deploy

A aplicação é publicada na Vercel pela CLI, a partir de `ntf-project/`, com o build de demonstração (mocks ligados pelo `.env` versionado). O `vercel.json` reescreve todas as rotas para o `index.html`, para o acesso direto e o refresh funcionarem, e serve os arquivos de `/assets` com cache imutável. O `.vercelignore` deixa relatórios e baselines fora do envio.

```bash
npm i -g vercel
vercel login
vercel link
vercel deploy --prod
```

O `vercel link` cria a pasta `.vercel/` (ignorada pelo Git) com o vínculo do projeto. Sem `--prod`, o `vercel deploy` gera uma URL de prévia.

## Estrutura do repositório

```
docs/                      enunciado, contratos, testes E2E e Lighthouse
ntf-project/
  src/
    api/                   cliente Axios, contratos zod e erros normalizados
    app/                   Query, Router, sessão e tempo real
    routes/                rotas do TanStack Router (arquivos)
    features/<área>/       telas, hooks do Query e mapeamentos por área
    components/            layout, componentes comuns e shadcn/ui
    mocks/                 MSW: handlers, banco simulado, fixtures, cenários, Socket.IO e painel
  tests/                   Playwright: unit/, e2e/ e fixtures/
  lighthouse/              configuração, relatórios e RESULTADOS.md
  scripts/                 auditoria do Lighthouse e otimização de imagens
```
