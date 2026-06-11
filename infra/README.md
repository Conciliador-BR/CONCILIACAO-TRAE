# Infraestrutura

Esta pasta guarda a parte de infraestrutura do projeto.

## Objetivo

Organizar, em um lugar só, tudo o que for usado para publicar o sistema e receber arquivos das adquirentes.

## Estrutura atual

```text
infra/
  README.md
  vps-organizacao-iniciante.md
  adquirentes/
    README.md
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

## Como pensar esta pasta

- `infra/` = area geral de infraestrutura
- `infra/adquirentes/` = organizacao por adquirente
- `infra/adquirentes/cielo/` = material especifico da Cielo
- `infra/adquirentes/lecard/` = placeholder da Lecard
- `infra/adquirentes/vr/` = placeholder da VR
- `infra/vps-organizacao-iniciante.md` = guia simples para nao se perder na VPS

## Ordem recomendada

1. Ler `vps-organizacao-iniciante.md`
2. Ler `adquirentes/README.md`
3. Criar a VPS
4. Subir o SFTP da adquirente desejada
5. Testar o acesso
6. Depois publicar o site

## Regra de organizacao

- Nao misturar arquivos do site com arquivos das adquirentes
- Nao salvar senhas no repositório
- Nao criar pastas aleatorias fora do plano
- Fazer uma coisa por vez
