# Auditoria Lighthouse

Início (`/`) e detalhe do NFT (`/nft/emerald-ape-042`) auditados nos perfis mobile e desktop do Lighthouse, com o build de produção e o cenário padrão dos mocks (§10 do desafio). As quatro metas foram atingidas nas quatro combinações.

| Página | Perfil | Performance (≥ 90) | Accessibility (≥ 95) | Best Practices (≥ 95) | SEO (≥ 90) | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 92 | 100 | 100 | 100 | 2,8 s | 0 | 52 ms |
| Início | Desktop | 100 | 100 | 100 | 100 | 0,6 s | 0 | 0 ms |
| Detalhe do NFT | Mobile | 92 | 100 | 100 | 100 | 2,8 s | 0 | 32 ms |
| Detalhe do NFT | Desktop | 100 | 100 | 100 | 100 | 0,6 s | 0 | 0 ms |

Mediana de 3 medições. As medições individuais, as métricas de FCP e Speed Index, as versões e o ambiente estão em [`ntf-project/lighthouse/RESULTADOS.md`](../ntf-project/lighthouse/RESULTADOS.md). Os relatórios HTML e JSON de cada medição ficam em [`ntf-project/lighthouse/reports/`](../ntf-project/lighthouse/reports/).

## Como reproduzir

Execute dentro de `ntf-project/`, com as dependências instaladas e o Chromium do Playwright (`npx playwright install chromium`):

```bash
npm run lighthouse
```

O script faz o build e serve o `dist` em `https://localhost:4174`. Em seguida, roda 3 medições de cada página em cada perfil, alternando as combinações para que uma oscilação da máquina não caia toda sobre a mesma. Por fim, grava os relatórios, o `summary.json` e o `RESULTADOS.md`. A rodada leva de 6 a 8 minutos. A variável `CHROME_PATH` troca o navegador.

| Arquivo | Conteúdo |
| --- | --- |
| `lighthouse/audit.config.mjs` | Páginas, perfis, número de medições, categorias e metas |
| `lighthouse/mobile.config.mjs` | Perfil mobile padrão do Lighthouse, só com as quatro categorias do desafio |
| `lighthouse/desktop.config.mjs` | Perfil desktop padrão (o mesmo de `--preset=desktop`), só com as quatro categorias |
| `scripts/lighthouse.mjs` | Servidor, execução das medições, medianas e resumo |

## Condições

- **Ferramentas:** Lighthouse 13.5 pela CLI, no Chromium 153 do Playwright em modo headless. Cada medição abre um Chrome novo, com perfil temporário, sem cache, service worker nem dados salvos: é sempre a primeira visita.
- **Perfis:**
  - Mobile: Moto G Power emulado (412 × 823, DPR 1,75), 4G lento (RTT 150 ms, 1,6 Mbps) e CPU 4x mais lenta.
  - Desktop: 1350 × 940, RTT 40 ms, 10 Mbps e CPU sem desaceleração.
- **Throttling simulado** (padrão do Lighthouse e do PageSpeed Insights): a página carrega sem limitação, e o Lighthouse calcula as métricas sobre o grafo de dependências das requisições e tarefas observadas.
- **O app inteiro, como na entrega:**
  - MSW com o cenário "Padrão": latência de 120 a 400 ms por requisição, sorteada com semente fixa, e as fixtures iniciais;
  - Socket.IO simulado;
  - painel de cenários;
  - imagens AVIF/WebP e fonte Roboto Mono.

  Nada é desligado ou trocado para a auditoria.
- **HTTPS com HTTP/2:** o `vite preview` serve o build com um certificado local autoassinado, gerado pelo `@vitejs/plugin-basic-ssl`. O Chrome roda com `--ignore-certificate-errors`, porque sem isso não registra o service worker do MSW sob esse certificado. O motivo do HTTPS está na seção seguinte.

## Por que HTTP/2

O build tem cerca de 50 chunks de JS, porque o TanStack Router separa cada rota e o Rolldown separa as dependências compartilhadas. Sem TLS, o `vite preview` serve tudo em HTTP/1.1. Nesse protocolo, a simulação do Lighthouse aplica o limite de 6 conexões por origem, e cada chunk espera na fila. A Vercel, onde o app é publicado, serve em HTTP/2, que multiplexa as requisições numa só conexão. Medir em HTTP/1.1 penalizaria o app por uma limitação do servidor local que não existe em produção.

A tabela separa o efeito do protocolo do efeito das mudanças de código desta fase. Ela mostra a mediana de 3 medições da nota de Performance, com o mesmo script e a mesma máquina:

| Build | Protocolo | Início mobile | Detalhe mobile | Início desktop | Detalhe desktop |
| --- | --- | ---: | ---: | ---: | ---: |
| `main` antes desta fase | HTTP/1.1 | 69 | 72 | 96 | 93 |
| `main` antes desta fase | HTTP/2 | 88 | 88 | 100 | 96 |
| Esta fase | HTTP/1.1 | 76 | 75 | 97 | 97 |
| Esta fase (resultado oficial) | HTTP/2 | **92** | **92** | **100** | **100** |

O protocolo explica de 16 a 19 pontos no mobile. As mudanças de código explicam de 3 a 7 pontos no mobile e devolvem o desktop do detalhe a 100, porque eliminam o CLS de 0,112. Em HTTP/1.1, só a Performance mobile fica abaixo da meta; as outras categorias ficam em 100 nos dois protocolos.

## Análise

### Desktop

Performance 100 nas duas páginas, com FCP de 0,5 s, LCP de 0,6 s e nenhum tempo de bloqueio. O elemento do LCP é a arte principal: o primeiro destaque do carrossel no início e a imagem da galeria no detalhe, ambas com prioridade alta. O único problema medido era o CLS de 0,112 do detalhe, corrigido nesta fase.

### Mobile

Performance 92 nas duas páginas, com FCP de 2,5 s, LCP de 2,8 s, TBT de 32 a 52 ms e CLS 0. As métricas de carga (FCP e LCP) são as que tiram pontos. O que as limita:

- **JavaScript antes da primeira tela:** cerca de 313 KB (gzip) em 50 arquivos. O `index` (113 KB) traz o React DOM, o TanStack Router e o layout. Os chunks do layout raiz trazem o zod dos contratos, o Axios, o TanStack Query e os formulários. O pacote dos mocks tem 65 KB. A 1,6 Mbps, só a transferência leva perto de 1,6 s.
- **CPU:** a thread principal trabalha de 1,6 a 2,0 s no perfil mobile. O pacote dos mocks é o script mais caro (de 460 a 620 ms entre execução e inicialização do MSW), à frente do `index` (cerca de 500 ms).
- **Ordem de carga:** o app só monta depois que o MSW intercepta as requisições. A sequência é HTML, depois `index` e chunks, depois mocks e registro do service worker, depois a renderização, depois a API simulada, e só então a imagem do LCP.
- **Elemento do LCP:** no início, a imagem de um card da segunda linha da grade; no detalhe, a imagem principal da galeria. Os dois só são conhecidos depois da resposta da API.

Com uma API real, o pacote dos mocks e o registro do service worker sairiam do caminho crítico. Melhorias maiores dependeriam de pré-renderizar o HTML (SSR ou geração estática), o que muda a arquitetura de SPA escolhida para o desafio.

### Avisos que continuam nos relatórios

Nenhum destes avisos tira pontos das categorias. Os que pesam em Performance já estão refletidos nas métricas acima.

- **JavaScript não usado (cerca de 84 KiB):** quase metade do `index` e do pacote dos mocks não roda na primeira tela. No `index` estão o diálogo de acesso, os toasts e os componentes das outras rotas que ficam no layout raiz. No pacote dos mocks estão os handlers de todos os recursos (carrinho, pagamento, conta). O código das rotas já é separado por rota; separar mais o layout raiz e os handlers aumentaria o número de requisições sem ganho mensurável.
- **CSS bloqueante:** é um único arquivo de 20 KB (gzip) com todo o Tailwind. Extrair o CSS crítico para o HTML exigiria pré-renderizar as telas.
- **Descoberta do LCP:** a imagem do LCP só é conhecida depois que a API responde, e por isso não pode ser pré-carregada pelo HTML de uma SPA. O primeiro destaque do hero, os dois primeiros cards e a imagem principal do detalhe já usam `fetchpriority="high"` e `loading="eager"`. No início mobile, o LCP é um card da segunda linha da grade, que continua `lazy` porque no desktop essa linha fica abaixo da dobra.
- **Back/forward cache:** a causa listada é "ServiceWorker was unregistered while a page was in back/forward cache". É o próprio Lighthouse removendo o service worker entre as etapas da auditoria, não um comportamento do app.
- **Reflow forçado (cerca de 45 ms no mobile):** a barra de abas mede o espaço que ocupa na tela para ajustar o `scroll-padding`, o que mantém o foco do teclado visível acima dela. A leitura de layout acontece uma vez ao montar e a cada redimensionamento.

## O que mudou nesta fase

| Mudança | Efeito |
| --- | --- |
| `tldts` trocado por uma versão mínima no build (alias no `vite.config.ts`) | O MSW guarda cookies com o `tough-cookie`, que importa a lista completa de sufixos públicos de domínio (cerca de 245 KB de JS). A API simulada não usa cookies. O pacote dos mocks, que carrega antes da primeira tela, caiu de 477 para 214 KB (de 178 para 65 KB com gzip). |
| `public/robots.txt` | Sem ele, o fallback da SPA devolvia o `index.html` em `/robots.txt`, lido como um arquivo com 53 erros. SEO foi de 92 para 100. |
| Skeleton do detalhe com a altura mínima de uma tela | O rodapé aparecia durante o carregamento e era empurrado para baixo. O CLS do detalhe no desktop foi de 0,112 para 0. |
| Linha dos pontos do carrossel do hero com altura reservada | O hero do mobile crescia 24 px quando os destaques chegavam. O CLS do início no mobile foi de 0,027 para 0, junto com a mudança seguinte. |
| Botão do painel de cenários movido por `translate` com transição | O botão saltava quando uma barra fixa aparecia. Agora desliza junto com ela. |
| Nome acessível do NFT em destaque a partir do texto visível | Regra experimental do axe (WCAG 2.5.3) apontada pelo Lighthouse. Agora também roda nos testes de acessibilidade. |
| Auditoria em HTTPS/HTTP2 | Reproduz o protocolo de produção (seção anterior). |

Os testes cobrem as correções:
- `loading.spec.ts` mede o CLS do detalhe com rede lenta. O teste falha no código anterior (0,087) e passa com a correção.
- `accessibility.spec.ts` liga a regra `label-content-name-mismatch`. Ela falha no card antigo e passa com a correção.

### Testado e descartado

Duas mudanças de ordem de carregamento foram medidas e descartadas:
1. **Montar o app antes do MSW.** As requisições ficavam seguras até o MSW poder interceptá-las.
2. **Carregar o MSW só depois da primeira pintura.**

Com o pacote dos mocks ainda grande, a primeira melhorou o FCP mas piorou o LCP. Depois da remoção do `tldts`, as duas ficaram abaixo da ordem original (o app monta depois que o MSW intercepta): de 84 a 89 contra 93 no início mobile, em HTTP/2. O motivo é que pintar os skeletons antes antecipa requisições e soma uma renderização inteira antes do LCP. Por isso, a ordem original foi mantida.

## Limitações

- O throttling simulado parte do tempo de CPU medido nesta máquina (BenchmarkIndex por volta de 2.400). Numa máquina mais lenta, o TBT e o LCP do mobile sobem, e a nota de Performance pode ficar perto de 90.
- O servidor local comprime com gzip, sem CDN. A Vercel usa Brotli e cache de borda, então a produção tende a ser igual ou melhor.
- O MSW faz parte do caminho crítico: o app só monta depois que o service worker intercepta as requisições. Com uma API real, o pacote dos mocks (65 KB com gzip) e o registro do service worker sairiam desse caminho.
