# SFTP da Cielo

Antes de usar este guia, leiam primeiro `infra/vps-organizacao-iniciante.md`.

Depois leiam `infra/adquirentes/README.md` para entender a organizacao por adquirente.

## O que esta pasta faz

Esta pasta guarda a estrutura inicial para subir um servidor SFTP simples da Cielo.

## O que esta solucao resolve

- recebe os arquivos da Cielo por `SFTP`
- usa um usuario exclusivo para a Cielo
- guarda os arquivos em uma pasta unica chamada `upload`
- permite comecar com `usuario + senha`

## Arquivos desta pasta

- `docker-compose.yml`: sobe o servidor SFTP
- `.env.example`: modelo das variaveis que voces vao preencher
- `.gitignore`: evita salvar senhas e arquivos recebidos no repositorio

## Antes de comecar

Voces precisam de um servidor ou VM com:

- IP publico fixo ou host publico
- Docker e Docker Compose instalados
- porta liberada no firewall

## Como subir o servidor

1. Entrar na pasta `infra/adquirentes/cielo/sftp`
2. Copiar `.env.example` para `.env`
3. Trocar os valores do `.env`
4. Criar as pastas locais `data/upload` e `ssh/authorized_keys`
5. Subir o container com `docker compose up -d`

## Exemplo de `.env`

```env
SFTP_USER=cielo
SFTP_PASSWORD=uma-senha-bem-forte
SFTP_PORT=22
SFTP_HOST=sftp.seudominio.com.br
```

## Comandos uteis

Criar as pastas:

```powershell
New-Item -ItemType Directory -Force .\data\upload
New-Item -ItemType Directory -Force .\ssh\authorized_keys
```

Subir o servidor:

```powershell
docker compose up -d
```

Parar o servidor:

```powershell
docker compose down
```

Ver logs:

```powershell
docker compose logs -f
```

## Como preencher para a Cielo

- Protocolo de Conexao: `SFTP`
- IP de Conexao ou Host: valor de `SFTP_HOST`
- Porta SFTP: valor de `SFTP_PORT`
- Tipo de Autenticacao: `Senha`
- Usuario: valor de `SFTP_USER`
- Senha: valor de `SFTP_PASSWORD`
- Chave SSH: deixar em branco neste primeiro momento
- Diretorio unico para entrega dos arquivos: `/upload`
- OAuth2 Callback Url: deixar em branco por enquanto

## Regra importante de rede

Liberar no firewall o IP informado pela Cielo:

`54.232.53.112`

## Como testar depois de subir

```powershell
sftp cielo@SEU_HOST
```

Se pedir senha e abrir a sessao, o acesso basico esta funcionando.
