# Testes E2E (Playwright)

Os testes rodam contra o build de produção (`vite build` + `vite preview` na porta 4173) com os mocks ligados, em Chromium, nos projetos **desktop** (1440 × 900) e **mobile** (Pixel 7). O projeto **unit** cobre contratos e aritmética de ETH sem navegador.

## Comandos

Execute dentro de `ntf-project/`. Na primeira vez, instale o navegador com `npx playwright install chromium`.

| Comando | O que faz |
| --- | --- |
| `npm test` | Suíte completa (unit + desktop + mobile), com build antes |
| `npm run test:e2e` | Só os E2E, nos dois viewports |
| `npm run test:visual` | Só a regressão visual |
| `npm run test:visual:update` | Regrava as baselines depois de uma mudança visual intencional |
| `npm run test:report` | Abre o relatório HTML da última execução (`playwright-report/`) |

Falhas guardam screenshot e trace em `test-results/` (`npx playwright show-trace <arquivo>`).

## Isolamento e controle do tempo

- Toda execução começa com `__kurioMock.reset()`: fixtures restauradas, cenário "Padrão" e dados do app limpos no navegador (fixture automática em `tests/fixtures/mock.ts`).
- Latência e falhas vêm dos cenários do mock, com gerador de números de semente fixa.
- O relógio do mock é avançado ou recuado por `advanceClock` (sessão vencida, pedido pendente).
- Eventos em tempo real são disparados por mudanças no banco simulado (`updateNft`, `disconnectWallet`) e chegam pelo cliente Socket.IO real. O servidor de eventos pode ser derrubado com `setRealtimeOnline(false)`.
- As credenciais das contas de teste ficam em `tests/fixtures/accounts.ts`.

## Cobertura do §9 do desafio

| # | Cenário | Onde |
| --- | --- | --- |
| 1 | Busca, filtros combinados, ordenação, paginação e histórico | `catalog.spec.ts`: filtros combinados e ordenação com voltar/avançar, busca pelo campo, paginação, respostas fora de ordem, vazio |
| 2 | Detalhe por acesso direto e recurso inexistente | `catalog.spec.ts`: detalhe da API, "NFT não encontrado" |
| 3 | Cadastro, login, expiração, logout e troca de usuário | `auth.spec.ts` (cenário e relógio de sessão expirada, várias abas) e `realtime.spec.ts` (o socket acompanha a sessão) |
| 4 | Favoritos com falha de mutation e recuperação | `favorites.spec.ts`: otimista, falha desfaz e avisa, isolamento entre contas |
| 5 | Carrinho, quantidades, remoção, cupom e persistência | `cart.spec.ts`: refresh, merge ao entrar, cliques rápidos, cupons, preço alterado, esgotado |
| 6 | Compra completa, do catálogo ao recibo | `checkout.spec.ts`: busca, detalhe, edição, carrinho, pagamento, pedido pendente e recibo |
| 7 | Falha de pagamento, clique repetido e timeout | `checkout.spec.ts`: pagamento recusado, carteira recusada, clique duplo gera um só pedido, timeout recupera o mesmo pedido |
| 8 | Perfil, avatar, senha e carteiras com validação | `account.spec.ts` |
| 9 | Preço e disponibilidade via Socket.IO no checkout | `realtime.spec.ts`: "no checkout" (esgotado bloqueia, novo total na revisão) |
| 10 | Eventos duplicados ou antigos, desconexão e pedido pendente | `realtime.spec.ts`: duplicados e fora de ordem, reconexão com reconciliação, carteira desconectada, pedido retomado sem socket |
| 11 | Teclado, foco de diálogos e validação | `accessibility.spec.ts`: atalho para o conteúdo, foco visível, foco preso e devolvido (acesso, filtros, revisão), compra só pelo teclado, erros ligados aos campos, axe WCAG 2.2 A/AA em 8 telas e diálogos (com a regra experimental de nome acessível que contém o texto visível, WCAG 2.5.3) |
| 12 | Skeletons, falha e nova tentativa | `loading.spec.ts`: skeletons no catálogo, detalhe e carrinho, troca do skeleton pelo conteúdo sem deslocar o layout (CLS), shimmer parado com movimento reduzido, erro com "Tentar novamente". Também `catalog.spec.ts` (erro do servidor) |

`mocks.spec.ts` cobre a camada de mocks (cenários, latência, reset, painel).

## Regressão visual

`visual.spec.ts` captura início, detalhe, carrinho e pagamento nos dois viewports, com o cenário padrão e as fixtures restauradas. Antes da captura, o teste percorre a página para carregar as imagens tardias e espera imagens e fontes.

- **Página inteira:** sem as barras fixas. Na captura inteira, elas ficariam na altura da primeira tela, por cima do conteúdo.
- **Primeira tela (só no mobile):** com as barras fixas na posição real.
- **Painel de cenários:** fica fora de todas as capturas (`tests/fixtures/screenshot.css`), porque é um controle da demonstração, não do layout.
- **Estabilidade:** antes de capturar, o teste espera cada imagem visível decodificar (`decode()`), não só terminar de baixar. A captura da página inteira tem 30 s para conseguir as duas imagens iguais seguidas que o Playwright exige.
- **Tolerância:** até 20 pixels diferentes por captura. Com a máquina ocupada, a imagem reduzida do hero às vezes é rasterizada com 4 ou 5 pixels diferentes; uma mudança real de layout ou texto altera centenas.

As baselines ficam em `tests/e2e/visual.spec.ts-snapshots/`. O nome leva o sistema operacional (ex.: `inicio-desktop-win32.png`), porque a renderização de fontes muda entre sistemas. Em outro sistema, gere as baselines dele com `npm run test:visual:update` antes de comparar.
