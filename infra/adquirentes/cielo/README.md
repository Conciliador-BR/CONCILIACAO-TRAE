# Cielo

Esta pasta guarda o que for especifico da Cielo.

## Integracao atual

- recebimento por `SFTP`

## Modelo recomendado na VPS

Para cada empresa, usar o padrao:

- `/opt/conciliadora/cielo/<empresa>/inbox`

Exemplo:

- `/opt/conciliadora/cielo/norte_atacado/inbox`

O fluxo de pastas fica assim:

- `inbox`
- `processando`
- `processados`
- `erro`

## Estrutura

```text
infra/adquirentes/cielo/
  README.md
  sftp/
    .env.example
    .gitignore
    docker-compose.yml
    README.md
```

## Proximo passo

Usar a pasta `sftp/` para subir o ambiente de recebimento da Cielo.
