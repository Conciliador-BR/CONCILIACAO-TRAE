# Organizacao da VPS Para Iniciante

Este guia foi feito para quem nao tem experiencia com servidor e quer manter a VPS organizada desde o primeiro dia.

## Ideia principal

Voce nao vai separar primeiro por tipo de servico.

Voce vai separar primeiro por quem envia o arquivo.

O modelo recomendado agora e:

- `/opt/conciliadora/<adquirente>/<empresa>/<status>`

Exemplo:

- `/opt/conciliadora/cielo/norte_atacado/inbox`

## Estrutura recomendada na VPS

```text
/opt/conciliadora
/opt/conciliadora/cielo
/opt/conciliadora/cielo/norte_atacado
/opt/conciliadora/cielo/norte_atacado/inbox
/opt/conciliadora/cielo/norte_atacado/processando
/opt/conciliadora/cielo/norte_atacado/processados
/opt/conciliadora/cielo/norte_atacado/erro
/opt/conciliadora/vr
/opt/conciliadora/vr/norte_atacado
/opt/conciliadora/vr/norte_atacado/inbox
/opt/conciliadora/vr/norte_atacado/processando
/opt/conciliadora/vr/norte_atacado/processados
/opt/conciliadora/vr/norte_atacado/erro
/opt/conciliadora/logs
/opt/conciliadora/backups
```

## O que vai em cada pasta

- `/opt/conciliadora/<adquirente>`: separa cada operadora ou adquirente
- `/opt/conciliadora/<adquirente>/<empresa>`: separa cada cliente dentro da adquirente
- `/opt/conciliadora/<adquirente>/<empresa>/inbox`: onde o arquivo chega primeiro
- `/opt/conciliadora/<adquirente>/<empresa>/processando`: onde o arquivo fica enquanto esta sendo tratado
- `/opt/conciliadora/<adquirente>/<empresa>/processados`: onde vai o arquivo tratado com sucesso
- `/opt/conciliadora/<adquirente>/<empresa>/erro`: onde vai o arquivo que falhou
- `/opt/conciliadora/logs`: logs gerais do worker, SFTP ou servicos auxiliares
- `/opt/conciliadora/backups`: copias de seguranca

## Regra mais importante

Se nao souber onde colocar algo, nao invente.

Primeiro veja se ele pertence a uma destas areas:

- uma adquirente
- uma empresa
- um status do arquivo
- logs
- backups

Se nao pertencer, pergunte antes de criar.

## Padrao de nomes

Para evitar bagunca, use sempre nomes padronizados:

- tudo em minusculo
- sem acento
- espaco vira `_`
- nao usar caracteres especiais

Exemplos:

- `Cielo` vira `cielo`
- `VR` vira `vr`
- `Norte Atacado` vira `norte_atacado`
- `Sao Jose Center` vira `sao_jose_center`

## O que voce pode mexer sem medo

- pastas dentro de `/opt/conciliadora`
- arquivos `.env` criados por voces
- comandos de subir e parar containers
- organizacao das adquirentes e empresas seguindo o padrao

## O que voce nao deve mexer no inicio

- pastas do sistema fora de `/opt/conciliadora`
- configuracoes avancadas sem entender
- arquivos de sistema do Linux
- permissoes aleatorias copiadas da internet

## Estrutura por adquirente e empresa

```text
/opt/conciliadora
  cielo/
    norte_atacado/
      inbox/
      processando/
      processados/
      erro/
    loja_centro/
      inbox/
      processando/
      processados/
      erro/
  vr/
    norte_atacado/
      inbox/
      processando/
      processados/
      erro/
  logs/
  backups/
```

## O que significa cada status

- `inbox`: arquivo novo que acabou de chegar
- `processando`: arquivo que o worker pegou para tratar
- `processados`: arquivo que terminou com sucesso
- `erro`: arquivo que falhou e precisa de revisao

## Regra de ouro para nao desorganizar

- Uma pasta para cada adquirente
- Uma pasta para cada empresa
- Um fluxo claro para cada arquivo
- Nada de jogar arquivos soltos na raiz do servidor

## Sequencia pratica de trabalho

1. Entrar na VPS
2. Ir para `/opt/conciliadora`
3. Criar a pasta da adquirente
4. Criar a pasta da empresa
5. Criar as subpastas `inbox`, `processando`, `processados` e `erro`
6. Testar o recebimento
7. So depois ligar o worker para processar

## Primeiro dia de organizacao

No primeiro dia, o objetivo nao e publicar tudo.

O objetivo e deixar a casa pronta.

Faca nesta ordem:

1. Criar a pasta principal `/opt/conciliadora`
2. Criar `logs` e `backups`
3. Criar a pasta da adquirente, como `cielo` ou `vr`
4. Criar a pasta da empresa, como `norte_atacado`
5. Criar `inbox`, `processando`, `processados` e `erro`
6. Subir o SFTP da adquirente
7. Testar o recebimento do arquivo
8. So depois ligar o processamento automatico

## Como pensar para nao se assustar

Nao pense assim:

- "Tenho que configurar um servidor inteiro"

Pense assim:

- "Hoje vou so criar as pastas"
- "Depois vou testar a chegada do arquivo"
- "Depois vou ligar o worker"
- "Depois vou enviar para o Supabase"

## Modelo mental simples

- VPS = servidor alugado
- Pasta da adquirente = separa quem enviou
- Pasta da empresa = separa o cliente
- Pasta de status = mostra em que etapa o arquivo esta
- Pasta `backups` = copia de seguranca

## Checklist de seguranca simples

- usar senha forte
- guardar acessos em local seguro
- nao expor senhas no Git
- abrir so as portas necessarias
- liberar no firewall apenas o que for preciso

## Portas mais comuns

- `22` = SFTP
- `80` = site sem certificado
- `443` = site com certificado

## O que informar para a adquirente

Quando o ambiente estiver pronto, voces informam:

- protocolo: `SFTP`
- host: dominio ou IP da VPS
- porta: `22` ou a que voces definirem
- autenticacao: `Senha` ou `Chave`
- usuario: usuario do SFTP
- senha: senha do SFTP, se houver
- diretorio de entrega: a pasta combinada para a empresa

## Erros que iniciantes mais cometem

- criar arquivos em qualquer lugar
- misturar empresas diferentes na mesma pasta
- esquecer qual empresa usa qual diretorio
- trocar senha e nao anotar
- abrir muitas portas sem necessidade

## Regra final

Se a VPS estiver organizada por adquirente, empresa e status do arquivo, voce nao vai se perder.

Organizacao aqui vale mais do que experiencia.
