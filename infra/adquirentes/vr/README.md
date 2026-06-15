# VR

Esta pasta foi preparada para guardar o material da `VR`.

## Status

- estrutura criada
- instrucoes especificas ainda nao recebidas

## Quando chegarem as informacoes

Organizar aqui:

- tipo de integracao
- instrucoes de acesso
- dados obrigatorios
- arquivos de configuracao
- observacoes da operadora

## Modelo recomendado na VPS

Para cada empresa, usar o padrao:

- `/opt/conciliadora/vr/<empresa>/inbox`

Exemplo:

- `/opt/conciliadora/vr/norte_atacado/inbox`

O fluxo de pastas fica assim:

- `inbox`
- `processando`
- `processados`
- `erro`

## Estrutura sugerida

```text
infra/adquirentes/vr/
  README.md
  sftp/
```

Se a VR usar outro formato no futuro, esta pasta pode ser ajustada.
