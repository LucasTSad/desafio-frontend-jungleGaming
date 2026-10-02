# Arquitetura

Este documento descreve como o app se organiza, as políticas de sessão, carrinho, cache e tempo real, e as decisões, limitações e desvios do Figma. Os contratos completos, com rotas, corpos, erros e eventos, estão em [docs/contratos-api.md](docs/contratos-api.md).

## Visão geral

```
rotas (TanStack Router)
  └─ features/<área>: telas e hooks do TanStack Query
       └─ api/: cliente Axios + contratos zod + ApiError
            └─ rede ──► MSW (service worker): handlers ──► banco simulado (localStorage)
                                                                  │ cada gravação vira um evento
socket.io-client ──► WebSocket ──► MSW ws.link + socket.io-binding ◄┘
```

- **Rotas** (`src/routes/`): definem caminhos, parâmetros de busca validados com zod, guards de sessão e o prefetch dos dados. Os caminhos são em pt-BR: `/`, `/nft/$nftId`, `/carrinho`, `/pagamento`, `/pedidos/$orderId`, `/entrar`, `/cadastro`, `/conta/{perfil,carteiras,favoritos}`, além de uma 404 global.
- **Áreas** (`src/features/<área>/`): cada uma tem `api.ts` (chaves, `queryOptions` e mutations), `types.ts` (os tipos que as telas recebem), mapeadores do contrato para esses tipos e componentes. Os componentes recebem tudo por props e não conhecem a API.
- **Transporte** (`src/api/`): um único cliente Axios injeta o token e o `X-Cart-Id`, valida cada resposta com o schema zod do contrato e converte qualquer falha em `ApiError` (`code`, `message`, `fields`, `retryable`). Timeout e falta de conexão viram `TIMEOUT` e `NETWORK_ERROR` com `retryable: true`.
- **Mocks** (`src/mocks/`): handlers MSW, banco simulado, fixtures, cenários, servidor Socket.IO simulado e o painel de demonstração. Componentes, hooks e o cliente Axios não têm respostas fictícias nem caminhos alternativos: com `VITE_API_MOCKING` desligado, o mesmo código chama `VITE_API_URL`.

## Contratos REST e eventos

- **Uma definição para os dois lados:** os schemas zod de `src/api/contracts/` são usados pelo cliente, para validar as respostas, e pelos handlers do MSW, para validar os corpos e montar as respostas.
- **Valores em ETH:** trafegam como string decimal (`"1.19"`). Somas, multiplicações e descontos são feitos em wei (`bigint`, `src/lib/eth.ts`), e a conversão para texto acontece só na apresentação. Quantidades são inteiras.
- **Versões:** NFTs, carrinho e pedidos têm `version` crescente, a mesma que os eventos carregam.
- **Erros:** um envelope único (`{ error: { code, message, fields?, details?, retryable } }`) cobre validação, sessão inválida ou expirada, permissão, recurso inexistente, conflitos (cadastro, disponibilidade, cotação, idempotência) e falha transitória.

| Recurso | Rotas |
| --- | --- |
| Sessão e conta | `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` |
| NFTs | `GET /nfts` (busca, filtros, ordenação e paginação), `GET /nfts/highlights`, `GET /nfts/:id`, `GET /nfts/:id/related`, `GET /nfts/recommendations` |
| Favoritos | `GET /me/favorites`, `PUT` e `DELETE /me/favorites/:nftId` |
| Carrinho | `GET /cart`, `POST /cart/items`, `PATCH` e `DELETE /cart/items/:lineId`, `PUT` e `DELETE /cart/coupon`, `POST /cart/merge` |
| Cotação e carteira | `POST /checkout/quote`, `POST /wallet-connections`, `DELETE /wallet-connections/:id` |
| Pedidos | `POST /orders` (com `Idempotency-Key`), `GET /orders/:id`, `GET /me/orders?status=pending` |
| Perfil e carteiras | `GET` e `PATCH /me/profile`, `PUT` e `DELETE /me/avatar`, `POST /me/password`, `GET` e `PATCH /me/wallets`, `PUT /me/wallets/:slot` |

| Evento | Destino | Dados |
| --- | --- | --- |
| `nft.updated` | todas as conexões | preço, preço anterior e disponibilidade por edição |
| `order.updated` | só as conexões do dono | status, hash da transação e motivo da recusa |
| `wallet.disconnected` | só as conexões do dono | motivo |

Todo evento tem `eventId` estável (`tipo:recurso:versão`), `resource { type, id }`, `version` e `occurredAt`.

## Política de sessão

- **Token:** `POST /auth/login` devolve `{ token, expiresAt }`, guardado em `localStorage` (`kurio-session`). A sessão sobrevive ao refresh e vale em todas as abas. A validade é de 30 minutos, renovada a cada requisição autenticada.
- **Confirmação:** a consulta `['session']` confirma o token uma vez por carregamento (`staleTime` de 5 min). Os guards das rotas privadas (`beforeLoad` com `requireAuth`) reaproveitam essa consulta.
- **Rotas privadas:** pagamento, pedidos e conta. Sem sessão, o guard leva para `/entrar?redirect=<destino>`. O `redirect` só aceita caminhos internos, e nunca volta para as telas de acesso.
- **Expiração:** qualquer `SESSION_EXPIRED` ou `UNAUTHENTICATED`, em consulta ou mutation, encerra a sessão local (`session-sync.ts`):
  1. aparece o aviso "Sua sessão expirou";
  2. os guards são reavaliados, e a tela privada leva para Entrar guardando o destino;
  3. só então os dados privados são descartados.

  No checkout, o carrinho e o destino ficam preservados: depois do login, a pessoa volta ao pagamento com os mesmos itens.
- **Logout e troca de conta:** removem todas as consultas `['me', userId, ...]` e recriam o socket, sem token ou com o novo. Eventos que ainda cheguem pela conexão anterior são descartados. Entrar ou sair em uma aba chega às outras pelo evento `storage`.
- **Senhas:** o banco simulado guarda só o hash SHA-256 com salt por usuário (Web Crypto). Nenhuma senha fica em claro nas fixtures.

## Estado do carrinho

- **Fonte da verdade:** o carrinho vive na API simulada. Toda mutation devolve o carrinho inteiro, já recalculado (subtotal, desconto, taxa de rede e total). O cliente não recalcula totais.
- **Visitante:** recebe um `X-Cart-Id` (UUID em `kurio-cart-id`) só ao adicionar o primeiro item. Antes disso, nem consulta a API.
- **Ao entrar:** o carrinho do visitante é juntado ao da conta (`POST /cart/merge`) antes de o login terminar. As quantidades são somadas e limitadas pelo disponível, e o ajuste é avisado. Depois disso, o id do visitante é descartado.
- **Chaves:** `['me', userId, 'cart']` para a conta e `['cart', 'guest', id]` para o visitante. O carrinho da conta é descartado no logout, junto com os outros dados privados.
- **Concorrência:** as mutations do carrinho compartilham um `scope`, e o TanStack Query as executa uma de cada vez.
  - Quantidade e remoção são otimistas.
  - Enquanto há outras mudanças na fila, as respostas intermediárias não substituem a tela.
  - Respostas com `version` menor que a do cache são descartadas.
  - Em erro, o carrinho é buscado de novo, em vez de voltar a um retrato que pode estar velho.
- **Preço e disponibilidade:** a linha guarda o preço que a pessoa viu. Se o preço atual difere, a linha fica `price-changed` até a pessoa aceitar o novo valor. Uma edição esgotada deixa a linha `unavailable`. Nos dois casos, o checkout fica bloqueado até a pessoa resolver.
- **Depois da compra:** só um pedido confirmado tira itens do carrinho, e apenas as quantidades compradas. Com o pedido recusado, o carrinho não muda.

## Estratégia de cache (TanStack Query)

| Configuração | Valor | Motivo |
| --- | --- | --- |
| `staleTime` | 30 s (sessão: 5 min) | Navegar entre telas não refaz consultas recentes; o tempo real e as invalidações cuidam das mudanças |
| `gcTime` | 5 min | Voltar para uma tela recente mostra os dados na hora e atualiza em segundo plano |
| `refetchOnWindowFocus` | desligado | Mudanças chegam por eventos; focar a janela não deve gerar uma rajada de requisições |
| `retry` (consultas) | até 2 novas tentativas, só para erros `retryable` | Falhas transitórias (rede, timeout, 503) se recuperam sozinhas; erros de negócio (4xx) aparecem na hora |
| `retryDelay` | 0,5 s e depois 1 s (teto de 4 s) | Espera crescente entre as tentativas |
| `retry` (mutations) | nenhum | Repetir mutation às cegas pode duplicar operações. O único reenvio é o do pedido, com a mesma chave de idempotência |

- **Chaves por parâmetro e por usuário:**
  - catálogo em `['nfts', 'list', query]`, com uma chave por combinação de filtros;
  - detalhe em `['nfts', 'detail', id]`;
  - dados privados sob `['me', userId, ...]`: perfil, carteiras, favoritos, carrinho e pedidos.

  Uma conta nunca lê o cache de outra, e o logout descarta tudo sob `['me']`.
- **Respostas obsoletas:** toda consulta repassa o `AbortSignal` ao Axios. Quando os filtros mudam, a requisição anterior é cancelada, e uma resposta atrasada só poderia gravar na própria chave, nunca na lista em tela. Enquanto a próxima página carrega, a anterior continua visível (`placeholderData: keepPreviousData`).
- **Prefetch:** as rotas fazem prefetch no `loader`, e o Router pré-carrega a rota ao passar o mouse ou focar um link (`defaultPreload: 'intent'`), sempre pelo cache do Query.
- **Otimista com rollback:** favoritos.
  - O coração muda na hora; se a mutation falha, volta ao estado anterior, com aviso acessível.
  - O clique só decide entre favoritar e remover depois de conhecer a lista (`ensureQueryData`).
  - Vários cliques seguidos só sincronizam quando o último termina.
  - O carrinho também é otimista em quantidade e remoção.
- **Invalidação:**
  - mutations do carrinho gravam a resposta no cache;
  - perfil atualiza também o usuário da sessão (nome e avatar no cabeçalho);
  - pedido confirmado invalida carrinho e catálogo;
  - eventos invalidam o que afetam (veja abaixo).
- **Estados na tela:** cada consulta tem carregando (skeleton nas dimensões do conteúdo), vazio, erro com "Tentar novamente" e atualização em segundo plano, que mantém o conteúdo visível.

## Tempo real e reconciliação com o REST

- **Conexão:** um socket por sessão, `io(origem, { path: '/socket.io', transports: ['websocket'], auth: { token } })`. O visitante conecta sem token e recebe só eventos públicos. O `socket.io-client` é carregado depois que o MSW liga, porque o `engine.io-client` guarda a referência do `WebSocket` global ao carregar.
- **Registro de eventos:** um ledger por conexão descarta `eventId` repetido e versão menor ou igual à última aplicada do mesmo recurso. Assim, duplicatas e eventos fora de ordem não regridem o estado nem repetem avisos.
- **`nft.updated`:**
  - invalida catálogo, detalhe e carrinho, e as telas abertas buscam o estado atual pelo REST;
  - se o NFT está na tela ou no carrinho, a mudança é anunciada na live region;
  - uma cotação aberta no pagamento não é trocada em silêncio: o "Confirmar e pagar" cota de novo e, se o total mudou, pede nova confirmação.
- **`order.updated`:**
  - atualiza o pedido no cache sem regredir estados finais: confirmado e recusado são terminais, e um evento antigo não volta o pedido a pendente;
  - se havia uma leitura em andamento, refaz a consulta em vez de gravar por cima;
  - ao confirmar, invalida carrinho e catálogo.
- **`wallet.disconnected`:** descarta a conexão da carteira do pagamento e avisa. A próxima confirmação conecta de novo.
- **Isolamento:** eventos privados só são entregues às conexões do dono, pelo token do pacote CONNECT. No cliente, eventos de um socket anterior (antes de logout ou troca de conta) são ignorados.
- **Reconexão:** ao reconectar, o cliente invalida as consultas, e as ativas (carrinho, NFT aberto, página do catálogo, pedidos) se reconciliam com a API. Eventos perdidos durante a queda não fazem falta.
- **Pedido pendente sem socket:** com o socket conectado, a tela do pedido espera o `order.updated`. Desconectada, ela consulta a API a cada 1,5 s. Depois de um refresh, o pagamento busca os pedidos pendentes (`GET /me/orders?status=pending`) e mostra "Acompanhar o pedido", sem criar outra compra.
- **Origem dos eventos no mock:** toda gravação no banco simulado é comparada com o estado anterior, e o evento sai dessa diferença. Mudar dados pelo `__kurioMock` ou por outra aba atualiza o REST e emite o evento correspondente pelo mesmo caminho.

## Checkout e pedidos

1. **Revisar compra:** "Confirmar compra" valida o formulário e pede a cotação (`POST /checkout/quote`). A cotação revalida preço, disponibilidade, cupom e taxa da rede escolhida. O diálogo mostra os valores da API.
2. **Chave de idempotência:** um UUID é gerado quando a revisão abre e reutilizado em cliques repetidos e em reenvios. A chave só é trocada depois de uma nova cotação.
3. **Confirmar e pagar:**
   1. conecta a carteira simulada, reaproveitando a conexão válida;
   2. cota de novo; se algo mudou desde a revisão, o diálogo mostra "O total mudou" e exige nova confirmação;
   3. cria o pedido. Falhas transitórias são reenviadas até 3 vezes com a mesma chave, e a API devolve o pedido já criado em vez de outro. Reusar a chave com outro corpo dá `409 IDEMPOTENCY_KEY_REUSED`.
4. **Pedido:** fica pendente por 3 s no relógio do mock e termina confirmado ou recusado. O resultado é decidido na criação, pelo cenário ativo naquele momento. O recibo mostra o retrato do pedido (itens, cupom, taxas e total), que não muda se o catálogo mudar depois. O recibo só aparece para pedido confirmado.

## API simulada

- **Ativação:** com `VITE_API_MOCKING=enabled`, o `main.tsx` carrega os mocks e espera o service worker do MSW antes de montar o app. Por isso, nenhuma requisição escapa da simulação.
- **Banco simulado:**
  - parte de fixtures determinísticas: 36 NFTs em 9 coleções e 3 redes, 2 contas, 2 cupons e taxas por rede;
  - persiste em `localStorage` e relê o storage antes de gravar, para duas abas não se sobrescreverem;
  - o reset restaura integralmente as fixtures.
- **Cenários:**
  - configuram latência (gerador mulberry32 com semente fixa), falhas de rede (offline, 503, instável) e regras de negócio (sessão expirada, cupom, preço, estoque, carteira, timeout, recusa, eventos duplicados);
  - os efeitos únicos ficam marcados no banco, para valerem uma vez por ativação mesmo depois de recarregar a página;
  - a lista e a forma de usar estão no [README](README.md#cenários-da-api-simulada).
- **Relógio do mock:** sessões, cotações e pedidos usam um relógio que os testes avançam ou recuam (`advanceClock`). É assim que os testes sensíveis a tempo controlam expiração e confirmação sem esperar.
- **Testes:** os E2E passam pelos mesmos handlers e pelo mesmo `socket.io-client` da demonstração, e controlam os cenários por `window.__kurioMock`. O mapa da cobertura está em [docs/testes-e2e.md](docs/testes-e2e.md).

## Acessibilidade

- **Teclado:**
  - atalho "Pular para o conteúdo" e foco visível em todos os elementos;
  - foco preso e devolvido em diálogos e drawers;
  - na troca de página, o título é anunciado e o foco vai ao conteúdo principal quando o elemento focado deixou de existir.
- **Barras fixas do mobile:** informam a altura que cobrem, que vira `scroll-padding` do documento. Assim, o elemento focado nunca fica escondido atrás delas.
- **Formulários:** rótulos ligados aos campos, erros por `aria-describedby` e `aria-invalid`, e foco no primeiro campo inválido. Os erros da API aparecem no campo correspondente.
- **Feedback:** mutations e eventos em tempo real são anunciados por uma live region e por toasts.
- **Estados:** seleções, filtros ativos e itens alterados não dependem só de cor; há ícone, texto ou sublinhado.
- **Movimento reduzido:** o shimmer dos skeletons e as transições param com `prefers-reduced-motion`.
- **Verificação:** o axe (WCAG 2.2 A/AA) roda nos testes E2E em 8 telas e diálogos. A regra de nome acessível que contém o texto visível (WCAG 2.5.3) também está ligada.

## Performance

As metas do Lighthouse foram atingidas nas quatro combinações (início e detalhe, mobile e desktop). A análise completa, a comparação com a main e o que foi testado e descartado estão em [docs/lighthouse.md](docs/lighthouse.md). As decisões que afetam o código:

- **Ordem de boot:** o MSW liga antes de o app montar. Antecipar a montagem foi testado e piorou o LCP na simulação do Lighthouse, então a ordem original foi mantida.
- **Alias do `tldts`:** o `tough-cookie` do MSW importava a lista completa de sufixos públicos do `tldts`, cerca de 245 KB de JS. Como a API simulada não usa cookies, um alias no Vite (`src/mocks/vendor/tldts.ts`) troca o pacote por uma versão mínima. O pacote dos mocks caiu de 477 para 214 KB.
- **Sem deslocamento de layout:**
  - os skeletons têm as dimensões do conteúdo, e o do detalhe ocupa pelo menos uma tela;
  - os pontos do carrossel do hero reservam a altura antes dos dados;
  - o botão do painel de cenários sobe com `translate`, que não conta como deslocamento de layout, quando uma barra fixa aparece.
- **Imagens:** AVIF e WebP em 4 larguras (`npm run images`), com dimensões fixas, `fetchpriority="high"` na imagem do LCP e carregamento tardio nas demais. O hero renderiza só a variante do breakpoint atual, para não baixar a imagem do LCP duas vezes.
- **`robots.txt`:** sem ele, o fallback da SPA devolvia o `index.html` em `/robots.txt`.

## Decisões de UX

- **Login e cadastro:** no desktop, abrem num diálogo com abas sobre a página atual. No mobile, são telas cheias, como no Figma. As rotas `/entrar` e `/cadastro` também existem para acesso direto e para o retorno ao destino.
- **Catálogo:**
  - busca, coleções, redes, faixa de preço, aba, ordenação e página ficam na URL, e qualquer mudança de filtro volta para a página 1;
  - no mobile e no tablet, os filtros abrem numa gaveta;
  - chips mostram os filtros ativos.
- **Detalhe:** edições esgotadas ficam desabilitadas, e a quantidade é limitada pelo disponível e pelo máximo por pedido. No desktop, "Comprar NFT" adiciona ao carrinho e leva até ele; no mobile, a barra de compra fica fixa no rodapé.
- **Pagamento:**
  - a carteira principal vem primeiro e já selecionada;
  - os campos da carteira vêm preenchidos com a carteira escolhida;
  - no mobile, os dados do colecionador e o resumo ficam em acordeões, e "Confirmar compra" fica fixo no rodapé;
  - sem carteiras cadastradas, a tela explica como informar o endereço.
- **Perfil:** a nova foto de avatar só é aplicada ao salvar, e a tela avisa isso. O avatar é validado, recortado e convertido em WebP de 256 px no cliente.
- **Carteiras:** a principal começa com o formulário aberto quando ainda não existe.
- **Fora do escopo:** login social, "Esqueceu a senha?", newsletter, redes sociais, Criadores, Aprenda, "Ler mais" do Diário da Cunhagem, "Ver no Etherscan/Polygonscan" e os itens Atividade, Ofertas, Arquivos baixados e Suporte do menu da conta. Todos mostram que não estão disponíveis na demonstração (aviso ou selo "Em breve") e nunca aparentam sucesso.

## Desvios do Figma

O conector do Figma não tinha acesso de edição ao arquivo. O layout foi lido pelo protótipo público, com textos extraídos do modo de leitura e cores amostradas pixel a pixel nas capturas.

**Assets**

- **Artes dos NFTs:** são as 4 ilustrações do arquivo, otimizadas em AVIF e WebP a partir de `assets-src/`.
- **Galeria do detalhe:** as 4 miniaturas mostram recortes diferentes da arte (no Figma são iguais). Em telas pequenas, as miniaturas não aparecem.
- **Ícones:** `lucide-react` no lugar dos Iconly. O "f" do Facebook e o "in" do LinkedIn são desenhos próprios, porque o lucide não tem ícones de marca, e o pássaro do Twitter virou o X.
- **Ilustração "Thank you":** foi redesenhada em SVG a partir da original.
- **Fonte:** Roboto Mono variável. O Chrome a desenha um pouco mais grossa que o Figma.

**Acessibilidade**

| Ajuste | Motivo |
| --- | --- |
| Link "Aplique aqui" do pagamento sublinhado | No Figma, só a cor o distinguia do texto ao redor (WCAG 1.4.1) |
| Descrição e "Explorar" do card do hero mobile em creme (a seta continua laranja) | As cores do Figma davam contraste de 3,1 e 2,8 sobre o gradiente, abaixo de 4,5 |
| Ícone de mostrar a senha mais claro | Contraste mínimo para ícones |
| Pontos do carrossel: o inativo mais apagado, espaçamento de 24 px | No Figma os três são iguais; o espaçamento atende o tamanho mínimo de toque |
| ✓ no filtro selecionado, além da cor laranja | Estado não pode depender só de cor |
| Nome acessível do card "NFT em destaque" vem do texto visível, mais o nome do NFT só para leitores de tela | Quem usa comando de voz fala o que vê (WCAG 2.5.3) |
| Rótulos invisíveis nos campos de login e cadastro, mantendo os placeholders do Figma | Placeholder não substitui rótulo |
| "ENS ou carteira secundária" com rótulo visível | O campo não tinha rótulo |
| "Carteiras compatíveis" do rodapé com 11 px quando a lista quebra linha (abaixo de 1024 px) | 9 px fica ilegível em duas linhas; no desktop continua 9 px numa linha |
| Nome da conta no cabeçalho entre 768 e 1023 px só para leitores de tela (aparece o avatar) | Com texto espaçado, o nome estourava a tela |

**Layout e conteúdo**

- **Tab bar mobile:** simplificada. O recorte é um círculo, e o botão central é opaco em vez de translúcido.
- **Diário da Cunhagem:** os cards preenchem as 4 colunas.
- **Detalhe:** "Coleção" mostra a coleção do NFT em vez de "Kurio Apes" fixo. Os textos de "Contrato" e "Direitos autorais", trocados no Figma, foram corrigidos.
- **Cadastro no mobile:** o "Nome de usuário" fica alinhado à esquerda, como os outros campos (no Figma está centralizado).
- **Pagamento:**
  - o ENS é um campo de texto com sufixo `.eth` fixo, em vez de só um seletor ".eth";
  - "Carteira e rede" usa no desktop as mesmas três opções do mobile, no lugar da faixa de logos;
  - o endereço da carteira aparece abreviado (`0x5c3B…2b17`), em vez do nome ENS;
  - a carteira principal aparece antes da reserva.
- **Nome ENS:** opcional no perfil (sem asterisco no Figma) e obrigatório nas carteiras (com asterisco).
- **Conta no mobile:** sem frame no Figma. O menu lateral vira uma linha de botões em pílula com rolagem horizontal.
- **Sem frame no Figma, mesmo padrão visual:** tablet, confirmação no mobile, estados de carregando, vazio e erro, chips de filtros ativos, o botão "Filtros" no tablet, o aviso de itens alterados no carrinho e o aviso de pedido pendente.

## Limitações

- **Tudo roda no navegador:** cada navegador tem o próprio banco simulado no `localStorage`. Dados não são compartilhados entre dispositivos ou pessoas avaliando a mesma URL. Limpar os dados do site equivale a "Restaurar dados".
- **Service worker obrigatório:** o MSW exige service worker, ou seja, HTTPS ou `localhost`. Em navegadores ou modos que bloqueiam service workers (por exemplo, a janela privada do Firefox), a API simulada não sobe e o app não monta.
- **Token no `localStorage`:** escolha da simulação, porque o MSW no navegador não simula cookie `httpOnly`. Num backend real, a sessão iria para um cookie `httpOnly` e `SameSite`.
- **Socket.IO simulado:** o `@mswjs/socket.io-binding` só fala WebSocket (sem long-polling) e não tem salas, namespaces nem broadcast. O mock guarda as conexões e filtra os eventos privados pelo token. O binding responde ao handshake por conta própria, sem validar o token nessa etapa.
- **Servidor de eventos fora do ar:** quando ele é derrubado, novas conexões ficam sem resposta e o cliente desiste pelo timeout de 5 s antes de tentar de novo, em vez de receber uma recusa imediata.
- **Cookies no mock:** com o alias do `tldts`, o MSW não reconhece domínios registráveis. Cookies com atributo `Domain` não funcionariam, mas a API simulada não usa cookies.
- **Custo dos mocks:** o pacote dos mocks (214 KB, 65 KB com gzip) carrega antes da primeira tela também no build publicado. É o script mais caro da auditoria mobile; sem a camada de mocks, ele não existiria.
- **Lighthouse local:** a auditoria roda localmente, sobre o build servido em HTTPS/HTTP2, e não contra a URL publicada. Os números variam com a máquina; as condições estão registradas em `lighthouse/RESULTADOS.md`.
- **Baselines visuais:** geradas no Windows. Outros sistemas precisam gerar as próprias.
- **Fora do enunciado:** não há remoção de carteira nem lista de histórico de pedidos. O enunciado pede cadastro e edição de carteiras e a consulta de um pedido.
