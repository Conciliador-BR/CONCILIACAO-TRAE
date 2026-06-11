# Adquirentes

Esta pasta organiza a infraestrutura por adquirente.

## Objetivo

Evitar misturar instrucoes da Cielo com as de outras adquirentes e vouchers.

Cada adquirente pode ter:

- seu proprio guia
- seu proprio modo de integracao
- sua propria configuracao
- suas observacoes especificas

## Estrutura

```text
infra/adquirentes/
  cielo/
    README.md
    sftp/
      .env.example
      .gitignore
      docker-compose.yml
      README.md
  lecard/
    README.md
  vr/
    README.md
```

## Como usar

- `cielo/` = ja tem a estrutura inicial de SFTP
- `lecard/` = placeholder para organizar quando chegarem as instrucoes
- `vr/` = placeholder para organizar quando chegarem as instrucoes

## Regra simples

Cada pasta de adquirente deve guardar apenas o que for daquela adquirente.
