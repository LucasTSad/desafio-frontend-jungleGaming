# Resultados do Lighthouse

Gerado por `npm run lighthouse` em 02/10/2026, 19:32. Cada valor é a mediana de 3 medições por página e perfil; cada medição abre um Chrome novo, sem cache, service worker nem dados salvos. Em negrito, o que ficou abaixo da meta. A análise dos resultados está em [docs/lighthouse.md](../../docs/lighthouse.md).

## Pontuações (mediana)

| Página | Perfil | Performance (≥ 90) | Accessibility (≥ 95) | Best Practices (≥ 95) | SEO (≥ 90) |
| --- | --- | ---: | ---: | ---: | ---: |
| Início | Mobile | 92 | 100 | 100 | 100 |
| Início | Desktop | 100 | 100 | 100 | 100 |
| Detalhe do NFT | Mobile | 92 | 100 | 100 | 100 |
| Detalhe do NFT | Desktop | 100 | 100 | 100 | 100 |

## Métricas (mediana)

| Página | Perfil | LCP | CLS | TBT | FCP | Speed Index |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Início | Mobile | 2,8 s | 0,000 | 52 ms | 2,5 s | 2,5 s |
| Início | Desktop | 0,6 s | 0,000 | 0 ms | 0,5 s | 0,6 s |
| Detalhe do NFT | Mobile | 2,8 s | 0,000 | 32 ms | 2,5 s | 2,5 s |
| Detalhe do NFT | Desktop | 0,6 s | 0,000 | 0 ms | 0,5 s | 0,5 s |

## Medições individuais

| Página | Perfil | # | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | Relatórios |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Início | Mobile | 1 | 92 | 100 | 100 | 100 | 2,8 s | 0,000 | 46 ms | [HTML](reports/inicio-mobile-1.report.html) · [JSON](reports/inicio-mobile-1.report.json) |
| Início | Mobile | 2 | 93 | 100 | 100 | 100 | 2,7 s | 0,000 | 52 ms | [HTML](reports/inicio-mobile-2.report.html) · [JSON](reports/inicio-mobile-2.report.json) |
| Início | Mobile | 3 | 91 | 100 | 100 | 100 | 2,8 s | 0,000 | 109 ms | [HTML](reports/inicio-mobile-3.report.html) · [JSON](reports/inicio-mobile-3.report.json) |
| Início | Desktop | 1 | 100 | 100 | 100 | 100 | 0,6 s | 0,000 | 0 ms | [HTML](reports/inicio-desktop-1.report.html) · [JSON](reports/inicio-desktop-1.report.json) |
| Início | Desktop | 2 | 100 | 100 | 100 | 100 | 0,6 s | 0,000 | 0 ms | [HTML](reports/inicio-desktop-2.report.html) · [JSON](reports/inicio-desktop-2.report.json) |
| Início | Desktop | 3 | 100 | 100 | 100 | 100 | 0,6 s | 0,000 | 0 ms | [HTML](reports/inicio-desktop-3.report.html) · [JSON](reports/inicio-desktop-3.report.json) |
| Detalhe do NFT | Mobile | 1 | 92 | 100 | 100 | 100 | 2,8 s | 0,000 | 32 ms | [HTML](reports/detalhe-mobile-1.report.html) · [JSON](reports/detalhe-mobile-1.report.json) |
| Detalhe do NFT | Mobile | 2 | 92 | 100 | 100 | 100 | 2,8 s | 0,000 | 48 ms | [HTML](reports/detalhe-mobile-2.report.html) · [JSON](reports/detalhe-mobile-2.report.json) |
| Detalhe do NFT | Mobile | 3 | 93 | 100 | 100 | 100 | 2,8 s | 0,000 | 17 ms | [HTML](reports/detalhe-mobile-3.report.html) · [JSON](reports/detalhe-mobile-3.report.json) |
| Detalhe do NFT | Desktop | 1 | 100 | 100 | 100 | 100 | 0,6 s | 0,000 | 0 ms | [HTML](reports/detalhe-desktop-1.report.html) · [JSON](reports/detalhe-desktop-1.report.json) |
| Detalhe do NFT | Desktop | 2 | 100 | 100 | 100 | 100 | 0,6 s | 0,000 | 0 ms | [HTML](reports/detalhe-desktop-2.report.html) · [JSON](reports/detalhe-desktop-2.report.json) |
| Detalhe do NFT | Desktop | 3 | 100 | 100 | 100 | 100 | 0,6 s | 0,000 | 0 ms | [HTML](reports/detalhe-desktop-3.report.html) · [JSON](reports/detalhe-desktop-3.report.json) |

## Ferramentas e ambiente

- Lighthouse 13.5.0 (axe-core 4.13.0), pela CLI.
- Chromium 153.0.8010.12 em modo headless (`--headless=new --ignore-certificate-errors --allow-insecure-localhost`), o mesmo navegador dos testes do Playwright 1.63.0.
- Node v25.8.1 e Vite 8.3.2.
- Windows 11 Home Single Language 10.0.26200 (x64), 13th Gen Intel(R) Core(TM) i5-13450HX (16 threads), 16 GB de RAM. BenchmarkIndex do Lighthouse: 2399 (mediana).

## Condições de execução

- Build de produção (`vite build`) servido por `vite preview` em `https://localhost:4174` (protocolo h2, gzip), com certificado local autoassinado gerado pelo `@vitejs/plugin-basic-ssl`.
- API e Socket.IO simulados pelo MSW, como na entrega (`VITE_API_MOCKING=enabled`), no cenário "Padrão" (latência de 120 a 400 ms por requisição, sorteada com semente fixa) e com as fixtures iniciais.
- Imagens, fontes, painel de cenários e tempo real carregam como para qualquer visitante: nada é desligado para a auditoria.
- Mobile (`lighthouse/mobile.config.mjs`): 412 × 823, DPR 1,75; throttling `simulate` com RTT 150 ms, 1,6 Mbps e CPU 4x mais lenta.
- Desktop (`lighthouse/desktop.config.mjs`): 1350 × 940, DPR 1; throttling `simulate` com RTT 40 ms, 10 Mbps e CPU sem desaceleração.
