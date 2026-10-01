# DUTRA Fleet Context

Contexto mínimo de frota necessário ao motor atual. Este documento descreve a taxonomia usada pelo DUTRA OS; não pretende ser manual universal de engenharia veicular.

## Posições usadas pelo sistema

- **dianteiro** — eixo(s) dianteiro(s) atendidos;
- **tração** — eixo(s) motrizes tratados como tração pelo motor;
- **truck** — eixo adicional traseiro separado da tração na taxonomia atual;
- **carreta** — eixos do implemento/reboque atendidos.

## Configurações do motor

| ID | Nome operacional | Eixos base no motor |
|---|---|---|
| `3_4` | 3/4 | 1 dianteiro, 1 tração; truck opcional |
| `toco_4x2` | Toco 4x2 | 1 dianteiro, 1 tração |
| `trucado_6x2_8x2` | Truck 6x2 / Bi-Truck 8x2 | 1 ou 2 dianteiros, 1 tração, 1 truck |
| `trucado_reboque` | Trucado + reboque | 1 dianteiro, 1 tração, 1 truck, 2 carreta/reboque |
| `cavalo_toco_carreta3` | Cavalo toco + carreta 3 eixos | 1 dianteiro, 1 tração, 3 carreta |
| `trucado_carreta3` | Cavalo/trucado + carreta 3 eixos | 1 dianteiro, 1 tração, 1 truck, 3 carreta |
| `bitrem_7eixos` | Bitrem 7 eixos | 1 dianteiro, 4 carreta + tração 6x2/6x4 variável |
| `rodotrem_9eixos` | Rodotrem 9 eixos | 1 dianteiro, 2 tração, 6 carreta |

## Variáveis que mudam decisão técnica

- marca;
- Mercedes antes/depois de 2017;
- aro 17/19 no 3/4;
- truck 3/4 VW/MB;
- Scania com suspensão a ar;
- presença de redução;
- 6x2 x 6x4 no Bitrem;
- 8x2 no Bi-Truck;
- inclusão de dianteira;
- PSI.

## Como usar

Skill DUTRA Fleet explica a configuração e ajuda a formular perguntas. Quem decide código de suporte é o motor técnico, não o glossário.

Se uma descrição humana não permitir mapear com segurança para uma configuração existente, pedir/selecionar a informação que falta ou marcar VALIDAR.
