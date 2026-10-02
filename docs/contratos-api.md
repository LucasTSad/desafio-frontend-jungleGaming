# Contratos da API simulada — proposta

> Contratos aprovados para a implementação dos mocks e da integração.

## 1. Convenções gerais

- **Base:** `/api/v1` (configurável por `VITE_API_URL`). JSON em UTF-8, datas em ISO 8601 UTC.
- **Valores em ETH:** sempre **string decimal** com até 18 casas (`"1.19"`, `"0.016"`). O cliente soma e compara em wei (`bigint`) e só formata na apresentação. Quantidades são inteiros.
- **Autenticação:** `Authorization: Bearer <token>` nas rotas privadas.
- **Visitante:** o carrinho do visitante é identificado por `X-Cart-Id` (UUID gerado pelo cliente).
- **Idempotência:** `Idempotency-Key: <uuid>` obrigatório em `POST /orders`.
- **Versão de recurso:** NFTs, carrinho e pedidos trazem `version` (inteiro crescente). Os eventos usam a mesma versão para descartar dados antigos.
- **Validação:** todas as requisições e respostas têm schema zod em `src/api/contracts/`. O mesmo schema é usado pelos handlers MSW e pelo cliente Axios, que valida a resposta antes de entregá-la ao TanStack Query.

### Envelope de erro

```ts
type ApiError = {
  error: {
    code: ErrorCode
    message: string                     // texto em pt-BR, pronto para a interface
    fields?: Record<string, string>     // erros por campo (validação e conflito)
    details?: unknown                   // dados extras (ex.: nova cotação, disponível)
    retryable: boolean                  // true só para falhas transitórias
  }
}
```

| HTTP | `code` | Quando |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Parâmetro malformado |
| 401 | `UNAUTHENTICATED` | Sem token ou token inválido |
| 401 | `SESSION_EXPIRED` | Token expirado; o cliente guarda o contexto e pede login |
| 401 | `INVALID_CREDENTIALS` | Login com e-mail ou senha errados |
| 403 | `FORBIDDEN` | Recurso de outro usuário (pedidos respondem 404 para não revelar existência) |
| 404 | `NOT_FOUND` | NFT, pedido ou item inexistente |
| 409 | `EMAIL_TAKEN` / `USERNAME_TAKEN` | Conflito de cadastro ou perfil |
| 409 | `ADDRESS_IN_USE` | Endereço já usado na outra carteira |
| 409 | `AVAILABILITY_CONFLICT` | Quantidade acima do disponível (`details.available`) |
| 409 | `QUOTE_CHANGED` | Preço, disponibilidade, cupom ou taxa mudou (`details.quote`) |
| 409 | `IDEMPOTENCY_KEY_REUSED` | Mesma chave com conteúdo diferente |
| 410 | `QUOTE_EXPIRED` | Cotação vencida |
| 422 | `VALIDATION_ERROR` | Erros de campo (`fields`) |
| 422 | `COUPON_INVALID` / `COUPON_EXPIRED` | Cupom recusado |
| 422 | `INVALID_CURRENT_PASSWORD` | Senha atual incorreta |
| 409 | `WALLET_REJECTED` | Conexão recusada na carteira simulada |
| 503 | `SERVICE_UNAVAILABLE` | Falha transitória (`retryable: true`) |

Timeout e falta de conexão não têm corpo: o Axios os normaliza para `NETWORK_ERROR` / `TIMEOUT` com `retryable: true`.

## 2. Sessão e conta

| Método | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ username, email, password }` (o nome de exibição começa igual ao usuário) | `201 { session, user }` · 409 `EMAIL_TAKEN`/`USERNAME_TAKEN` · 422 |
| POST | `/auth/login` | `{ email, password }` | `200 { session, user }` · 401 `INVALID_CREDENTIALS` |
| GET | `/auth/session` | — | `200 { user, expiresAt }` · 401 `SESSION_EXPIRED` |
| POST | `/auth/logout` | — | `204` |

```ts
type Session = { token: string; expiresAt: string }
type User = { id: string; displayName: string; username: string; email: string; avatarUrl: string | null }
```

- O mock guarda só **hash da senha** (SHA-256 com salt por usuário, via Web Crypto); nenhuma senha fica em claro nas fixtures.
- O token tem validade de 30 min, renovada a cada requisição autenticada. Um cenário força a expiração.
- **Decisão:** o token fica em `localStorage`, então a sessão sobrevive a refresh e a novas abas. Cookie `httpOnly` não é simulável com MSW no navegador.
- **No cliente:** o token fica em `kurio-session`. A consulta `['session']` confirma a sessão uma vez por carregamento e os guards (`beforeLoad`) a reaproveitam. Consultas privadas usam `['me', userId, ...]` e são descartadas ao sair ou trocar de conta. Qualquer `SESSION_EXPIRED`/`UNAUTHENTICATED` encerra a sessão local, avisa "Sua sessão expirou…" e leva para `/entrar?redirect=<destino>`. Entrar ou sair em uma aba vale para as outras (evento `storage`).
- **Cenário `sessao-expirada`:** sessões criadas antes de o cenário ser ativado respondem `SESSION_EXPIRED`; um novo login funciona normalmente. O relógio do mock (`advanceClock`) também vence sessões pelo prazo de 30 min.

## 3. NFTs

| Método | Rota | Resposta |
| --- | --- | --- |
| GET | `/nfts?q&collections&networks&priceMin&priceMax&tab&sort&page&pageSize` | `200 NftPage` |
| GET | `/nfts/highlights` | `200 { hero: NftSummary[]; featured: NftSummary }` |
| GET | `/nfts/:id` | `200 NftDetail` · 404 |
| GET | `/nfts/:id/related` | `200 { items: NftSummary[] }` ("Mais desta coleção") · 404 |
| GET | `/nfts/recommendations?exclude=id1,id2` | `200 { items: NftSummary[] }` ("Colecionadores também viram") |

- Os parâmetros são os mesmos da URL do catálogo: listas separadas por vírgula, preços em string ETH e `page` começando em 1.
- O cliente cancela a consulta anterior pelo `AbortSignal` do Query e descarta respostas obsoletas.
- `facets` descreve o catálogo inteiro (não muda com os filtros), para as contagens da barra lateral ficarem estáveis. No cenário `vazio`, listagem, relacionados e recomendações voltam vazios; os destaques continuam.
- No cliente, cada combinação de filtros é uma chave própria (`['nfts', 'list', query]`): uma resposta atrasada só atualiza a própria chave e nunca a lista em tela. Enquanto a próxima página carrega, a anterior continua visível.

```ts
type NftSummary = {
  id: string; name: string; artwork: { src: string; alt: string }
  priceEth: string; previousPriceEth: string | null
  collection: CollectionSlug; network: NetworkSlug; isRare: boolean
  version: number
}
type NftPage = {
  items: NftSummary[]; page: number; pageSize: number; total: number; pageCount: number
  facets: { collections: { value: CollectionSlug; count: number }[]; networks: { value: NetworkSlug; count: number }[]; priceRange: { min: string; max: string } }
}
type NftDetail = NftSummary & {
  tokenId: string; creator: string; about: string; story: string[]
  networkInfo: string; contract: string; royalties: string; attributes: string[]
  rating: { average: number; count: number }; reviews: NftReview[]
  editions: { id: EditionId; label: string; available: number | null }[]   // null = edição aberta
  gallery: (NftArtwork & { focus?: { scale: number; x: number; y: number } })[]
  maxPerOrder: number
}
```

## 4. Favoritos (autenticado)

| Método | Rota | Resposta |
| --- | --- | --- |
| GET | `/me/favorites` | `200 { items: NftSummary[] }` |
| PUT | `/me/favorites/:nftId` | `204` (idempotente) · 404 |
| DELETE | `/me/favorites/:nftId` | `204` (idempotente) |

- Esta é a **atualização otimista** obrigatória: o coração muda na hora e volta ao estado anterior se a mutation falhar, com aviso acessível.
- O clique só decide entre favoritar e remover depois de conhecer a lista (`ensureQueryData`); vários cliques seguidos só sincronizam com a API quando o último termina. Visitante recebe um convite para entrar.
- Visitante que toca no coração vai para o login e volta ao NFT.

## 5. Carrinho

O mesmo recurso atende visitante (`X-Cart-Id`) e usuário (token). Todas as mutations devolvem o carrinho inteiro, já recalculado pela API.

| Método | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| GET | `/cart` | — | `200 Cart` |
| POST | `/cart/items` | `{ nftId, editionId, quantity }` | `200 Cart` · 409 `AVAILABILITY_CONFLICT` |
| PATCH | `/cart/items/:lineId` | `{ quantity }` ou `{ acceptPrice: true }` | `200 Cart` · 409 · 404 |
| DELETE | `/cart/items/:lineId` | — | `200 Cart` |
| PUT | `/cart/coupon` | `{ code }` | `200 Cart` · 422 `COUPON_INVALID`/`COUPON_EXPIRED` |
| DELETE | `/cart/coupon` | — | `200 Cart` |
| POST | `/cart/merge` | `{ guestCartId }` | `200 { cart: Cart; adjustments: CartAdjustment[] }` |

```ts
type Cart = {
  id: string; version: number
  lines: {
    id: string; nftId: string; nftVersion: number; name: string; artwork: NftArtwork; tokenId: string
    edition: { id: EditionId; label: string }
    quantity: number; maxQuantity: number
    unitPriceEth: string
    status: { kind: 'price-changed'; previousPriceEth: string } | { kind: 'unavailable' } | null
  }[]
  coupon: { code: string; description: string } | null
  totals: { subtotalEth: string; discountEth: string; networkFeeEth: string; totalEth: string }
}
type CartAdjustment = { nftId: string; editionId: EditionId; requested: number; kept: number }
```

- **Preço alterado:** a linha guarda o preço que o usuário viu. Quando o preço atual difere, a linha fica com `status: price-changed` até o usuário aceitar (`acceptPrice`).
- **Indisponível:** se a edição esgota, a linha fica `unavailable` e o checkout é bloqueado.
- **Merge no login:** soma as quantidades do visitante às da conta, limita pelo disponível e informa os ajustes.
- **Decisão:** o carrinho do visitante fica no servidor simulado, identificado por `X-Cart-Id`, para que preço e disponibilidade sempre venham da API.
- **No cliente:** o `X-Cart-Id` (UUID em `kurio-cart-id`) só nasce no primeiro item adicionado; antes disso o visitante não consulta a API. Com token, vale o carrinho da conta. Ao entrar, o carrinho do visitante é juntado antes de o login terminar e o id é descartado.
- **Preço alterado bloqueia o checkout** até a pessoa aceitar o novo valor ("Aceitar novo preço"), assim como item indisponível bloqueia até ser removido.
- **Concorrência:** as mudanças do carrinho vão para a API uma de cada vez (`scope` do TanStack Query), com quantidade e remoção otimistas; enquanto há outras na fila, respostas intermediárias não substituem a tela, e respostas com `version` menor que a do cache são descartadas.
- **Demonstração:** `window.__kurioMock.updateNft(id, { priceEth, editions })` muda preço/estoque de um NFT para exercitar esses estados.

## 6. Cotação e conexão de carteira (autenticado)

| Método | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| POST | `/checkout/quote` | `{ network, cartVersion }` | `200 Quote` · 409 `AVAILABILITY_CONFLICT` |
| POST | `/wallet-connections` | `{ provider, network, address }` | `201 { id, address, network, expiresAt }` · 409 `WALLET_REJECTED` |
| DELETE | `/wallet-connections/:id` | — | `204` |

```ts
type Quote = {
  id: string; expiresAt: string          // válida por 2 min
  cartVersion: number
  lines: { lineId: string; nftId: string; editionId: EditionId; name: string; artwork: NftArtwork; tokenId: string; editionLabel: string; quantity: number; unitPriceEth: string; subtotalEth: string }[]
  coupon: { code: string; description: string } | null
  totals: { subtotalEth: string; discountEth: string; networkFeeEth: string; totalEth: string }
}
```

- A cotação revalida preço, disponibilidade, cupom e taxa de rede de uma vez. Ela é o que o diálogo "Revisar compra" mostra e o que o pedido congela.
- A desconexão da carteira durante o pagamento sai pelo evento `wallet.disconnected` (seção 9).

## 7. Pedidos (autenticado)

| Método | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| POST | `/orders` + `Idempotency-Key` | `{ quoteId, walletConnectionId, collector, note }` | `201 Order` (nova) · `200 Order` (mesma chave e corpo) · 409 `IDEMPOTENCY_KEY_REUSED` · 409 `QUOTE_CHANGED` · 410 `QUOTE_EXPIRED` |
| GET | `/orders/:id` | — | `200 Order` · 404 (inexistente ou de outro usuário) |
| GET | `/me/orders?status=pending` | — | `200 { items: Order[] }` (retomar pendentes) |

```ts
type Order = {
  id: string; version: number
  status: 'pending' | 'confirmed' | 'refused'           // confirmed e refused são terminais
  createdAt: string; updatedAt: string
  network: CheckoutNetwork; provider: WalletProvider; walletAddress: string
  transactionHash: string | null; explorerUrl: string | null
  lines: Quote['lines']; coupon: Quote['coupon']; totals: Quote['totals']   // snapshot imutável
  failureReason: string | null
}
```

- **Idempotência:** o cliente gera a chave quando a revisão abre e a reutiliza em cliques repetidos e reenvios após timeout. Ela só é trocada depois de uma nova cotação. A chave pendente fica no `sessionStorage` para sobreviver a um refresh.
- **Itens no carrinho:** só saem do carrinho quando o pedido é **confirmado**, e apenas as quantidades compradas. Se o pedido for recusado, nada muda.
- O recibo só é exibido com `status: confirmed`.

## 8. Perfil e carteiras (autenticado)

| Método | Rota | Corpo | Resposta |
| --- | --- | --- | --- |
| GET | `/me/profile` | — | `200 Profile` |
| PATCH | `/me/profile` | `Partial<{ displayName, username, email, ensName, walletNickname }>` | `200 Profile` · 409 · 422 |
| PUT | `/me/avatar` | `multipart/form-data` (`file`, WebP 256 px já recortado no cliente) | `200 { avatarUrl }` · 422 |
| DELETE | `/me/avatar` | — | `204` |
| POST | `/me/password` | `{ currentPassword, newPassword }` | `204` · 422 `INVALID_CURRENT_PASSWORD` / `VALIDATION_ERROR` |
| GET | `/me/wallets` | — | `200 Wallets` |
| PUT | `/me/wallets/:slot` (`principal` \| `secundaria`) | `WalletInput` | `200 Wallets` · 409 `ADDRESS_IN_USE` · 422 |
| PATCH | `/me/wallets` | `{ secondaryIsPrincipal: boolean }` | `200 Wallets` · 422 (sem principal) |

```ts
type Profile = { displayName: string; username: string; email: string; ensName: string /* '' quando vazio */; walletNickname: string; avatarUrl: string | null; version: number }
type WalletRecord = { nickname: string; displayName: string; profileName: string; network: CheckoutNetwork; address: string; secondaryWallet: string /* '' quando vazia */; walletType: WalletProvider; referralCode: string; email: string; ensName: string }
type Wallets = { principal: WalletRecord | null; secundaria: WalletRecord | null; secondaryIsPrincipal: boolean }
```

## 9. Eventos Socket.IO

- **Conexão:** `io(VITE_SOCKET_URL, { transports: ['websocket'], auth: { token } })`, interceptada pelo `@mswjs/socket.io-binding`. O visitante conecta sem token e recebe só eventos públicos.
- **Troca de sessão:** no logout ou na troca de usuário, o socket é fechado e recriado. O cliente também descarta eventos que cheguem de uma conexão anterior.
- **Reconexão:** ao reconectar, o cliente invalida as consultas ativas (carrinho, NFT aberto, página do catálogo, pedidos pendentes) para reconciliar com o REST.

```ts
type RealtimeEvent<TType, TResource, TData> = {
  eventId: string          // identidade estável: duplicatas são ignoradas
  type: TType
  resource: { type: TResource; id: string }
  version: number          // eventos com versão <= à atual são ignorados
  occurredAt: string
  data: TData
}

type NftUpdated = RealtimeEvent<'nft.updated', 'nft', { priceEth: string; previousPriceEth: string | null; editions: { id: EditionId; available: number | null }[] }>
type OrderUpdated = RealtimeEvent<'order.updated', 'order', { status: Order['status']; transactionHash: string | null; failureReason: string | null }>
type WalletDisconnected = RealtimeEvent<'wallet.disconnected', 'wallet-connection', { reason: string }>
```

| Evento | Destino | Efeito no cliente |
| --- | --- | --- |
| `nft.updated` | todos | Atualiza catálogo, detalhe e carrinho, avisa por live region e invalida a cotação aberta |
| `order.updated` | só o dono (sala do usuário) | Atualiza o pedido; `confirmed` e `refused` são terminais e não regridem |
| `wallet.disconnected` | só o dono | Interrompe o pagamento e pede para reconectar |

- **Decisão:** `nft.updated` é enviado a todos os clientes, e cada um aplica só o que está em cache. O catálogo é pequeno o bastante para isso.

## 10. Mocks, fixtures e cenários

- **Ativação:** `VITE_API_MOCKING=enabled`, ligado em dev e no build de demonstração. Os dados ficam em `localStorage` sob uma chave versionada.
- **Fixtures determinísticas:**
  - os 36 NFTs atuais, em 9 coleções e 3 redes;
  - 2 usuários com senhas fictícias documentadas no README;
  - cupons `KURIO10` (válido) e `GENESIS` (expirado).
- **Cenários reproduzíveis** (latência por gerador com semente fixa):
  - rede: `padrao`, `lento`, `fora-de-ordem`, `offline`, `erro-servidor` (503 em tudo), `instavel` (cada requisição falha 3 vezes e funciona na 4ª);
  - dados: `vazio`, `sessao-expirada`, `cupom-expirado`, `preco-alterado`, `edicao-esgotada`;
  - compra: `carteira-recusada`, `timeout-pedido`, `pagamento-recusado`;
  - tempo real: `eventos-duplicados`.
- **Verificação:** `GET /health` responde `{ status, scenario, seed }` e passa pelas mesmas condições de rede.
- **Controle:** pelo parâmetro `?cenario=…` e pelo painel "API simulada" no canto inferior esquerdo. Os testes usam `window.__kurioMock` com `reset()`, `setScenario()`, `advanceClock(ms)` e, no 4f, `emit()`. O reset restaura integralmente as fixtures e apaga os dados do app no navegador (chaves `kurio-*`).
- **Mudanças nos dados** (preço, estoque, status do pedido) passam por uma única função do banco mock, que atualiza o REST e emite o evento correspondente.

## 11. Impacto no frontend atual

- `priceEth: number` passa a `string` nos tipos das telas, com utilitários `eth.ts` (wei/`bigint`) para somar e formatar.
- `src/dev/` é removido. As rotas passam a usar hooks do TanStack Query em `src/features/*/api.ts`, e os componentes não mudam de interface.
- O fluxo de pagamento troca os passos simulados por: conectar carteira (`POST /wallet-connections`), cotar (`POST /checkout/quote`) e criar o pedido (`POST /orders`).
