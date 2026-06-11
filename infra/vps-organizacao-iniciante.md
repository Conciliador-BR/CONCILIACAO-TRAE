# Organizacao da VPS Para Iniciante

Este guia foi feito para quem nao tem experiencia com servidor e tem medo de baguncar o ambiente.

## Ideia principal

Voce nao vai tratar a VPS como um computador cheio de pastas soltas.

Voce vai tratar a VPS como um armario com poucas gavetas, cada uma com uma funcao.

## Estrutura recomendada na VPS

```text
/opt/conciliadora
/opt/conciliadora/site
/opt/conciliadora/sftp
/opt/conciliadora/backups
/opt/conciliadora/logs
```

## O que vai em cada pasta

- `/opt/conciliadora/site`: aplicacao principal e arquivos de publicacao
- `/opt/conciliadora/sftp`: estrutura de recebimento das adquirentes
- `/opt/conciliadora/backups`: copias de seguranca
- `/opt/conciliadora/logs`: anotacoes e logs exportados quando precisar

## Regra mais importante

Se nao souber onde colocar algo, nao invente.

Primeiro veja se ele pertence a uma destas areas:

- site
- sftp
- backups
- logs

Se nao pertencer, pergunte antes de criar.

## O que voce pode mexer sem medo

- arquivos dentro de `/opt/conciliadora/site`
- arquivos dentro de `/opt/conciliadora/sftp`
- arquivos `.env` criados por voces
- comandos de subir e parar containers

## O que voce nao deve mexer no inicio

- pastas do sistema fora de `/opt/conciliadora`
- configuracoes avancadas sem entender
- arquivos de sistema do Linux
- permissoes aleatorias copiadas da internet

## Estrutura do SFTP dentro da VPS

```text
/opt/conciliadora/sftp
  cielo/
    .env
    docker-compose.yml
    data/
      upload/
    ssh/
      authorized_keys/
  vr/
  lecard/
```

## Estrutura do site dentro da VPS

```text
/opt/conciliadora/site
  app/
  .env
  docker-compose.yml
```

## Regra de ouro para nao desorganizar

- Uma pasta para cada assunto
- Um servico por vez
- Um arquivo `.env` por projeto
- Nada de jogar arquivos na raiz do servidor

## Sequencia pratica de trabalho

1. Entrar na VPS
2. Ir para `/opt/conciliadora`
3. Escolher se vai mexer no `site` ou no `sftp`
4. Fazer a alteracao
5. Testar
6. Anotar o que foi mudado

## Primeiro dia de organizacao

No primeiro dia, o objetivo nao e publicar tudo.

O objetivo e deixar a casa pronta.

Faca nesta ordem:

1. Criar a pasta principal `/opt/conciliadora`
2. Criar as subpastas `site`, `sftp`, `backups` e `logs`
3. Copiar para `sftp` os arquivos da pasta da adquirente desejada, como `infra/adquirentes/cielo/sftp`
4. Criar o arquivo `.env`
5. Subir o SFTP da adquirente
6. Testar o acesso
7. So depois pensar no site

## Como pensar para nao se assustar

Nao pense assim:

- "Tenho que configurar um servidor inteiro"

Pense assim:

- "Hoje vou so organizar as pastas"
- "Depois vou subir so o SFTP"
- "Depois vou testar"
- "Depois vou publicar o site"

## Modelo mental simples

- VPS = servidor alugado
- Pasta `site` = onde mora a aplicacao
- Pasta `sftp` = onde as adquirentes entregam os arquivos
- Pasta `backups` = copia de seguranca

## Checklist de seguranca simples

- usar senha forte
- guardar acessos em local seguro
- nao expor senhas no Git
- abrir so as portas necessarias
- liberar o IP da Cielo no firewall

## Portas mais comuns

- `22` = SFTP
- `80` = site sem certificado
- `443` = site com certificado

## O que informar para a Cielo

Quando o SFTP estiver pronto, voces informam:

- protocolo: `SFTP`
- host: dominio ou IP da VPS
- porta: `22` ou a que voces definirem
- autenticacao: `Senha`
- usuario: usuario do SFTP
- senha: senha do SFTP
- diretorio: `/upload`

## Erros que iniciantes mais cometem

- criar arquivos em qualquer lugar
- esquecer onde subiu cada servico
- misturar site com SFTP
- trocar senha e nao anotar
- abrir muitas portas sem necessidade

## Regra final

Se a VPS estiver organizada em poucas pastas e com nomes claros, voce nao vai se perder.

Organizacao aqui vale mais do que experiencia.
