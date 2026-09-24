# Alelo / NAIP

## Fluxo

1. Lista os arquivos `ALELO` e `NAIP` na raiz do SFTP.
2. Extrai o CNPJ de 14 digitos do nome do arquivo.
3. Seleciona somente os arquivos do CNPJ escolhido na interface.
4. Baixa para `/opt/conciliadora/Alelo/processados/cnpj/<CNPJ>`.
5. Valida o arquivo local e move a origem para `PROCESSADOS/<CNPJ>` no SFTP Alelo.

O parsing de vendas e recebimentos nao faz parte deste fluxo.

## Segredo

O servidor Oracle precisa ter `sshpass` instalado. A senha SFTP deve existir somente no arquivo:

```text
/home/ubuntu/.config/conciliadora/alelo_sftp_password
```

Permissoes obrigatorias:

```bash
chmod 700 /home/ubuntu/.config/conciliadora
chmod 600 /home/ubuntu/.config/conciliadora/alelo_sftp_password
```

Nunca adicionar a senha ao Git, aos logs ou ao `nuxt.config.ts`.

## Configuracao

Valores opcionais de ambiente:

```text
ALELO_BASE_PATH
ALELO_SFTP_HOST
ALELO_SFTP_PORT
ALELO_SFTP_USER
ALELO_SFTP_REMOTE_DIR
ALELO_SFTP_PROCESSED_DIR
ALELO_SFTP_PASSWORD_FILE
```
