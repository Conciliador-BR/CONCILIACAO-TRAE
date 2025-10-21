# Envio de Extratos - Estrutura Componentizada

Esta pasta contém a versão componentizada do sistema de envio de extratos bancários, anteriormente concentrado em um único arquivo `useBancosSupabase.js`.

## 📁 Estrutura dos Arquivos

### `index.js`
Arquivo principal que exporta todos os composables da pasta para facilitar importações.

### `useValidacaoTabelas.js`
**Responsabilidade**: Validação e verificação de existência de tabelas no Supabase
- `testarTabela()` - Testa se uma tabela específica existe
- `verificarTabelaFormatos()` - Verifica tabela em diferentes formatos (maiúscula/minúscula)

### `useFormatacaoDados.js`
**Responsabilidade**: Formatação e normalização de dados
- `formatarData()` - Converte datas para formato YYYY-MM-DD
- `formatarValor()` - Processa valores monetários (vírgulas, pontos, etc.)
- `normalizarString()` - Remove acentos e caracteres especiais
- `truncarTexto()` - Limita tamanho de strings

### `useMapeamentoDados.js`
**Responsabilidade**: Mapeamento de dados bancários para formato da tabela
- `mapearDadosBancarios()` - Converte transações para formato do banco de dados
- `validarDadosMapeados()` - Valida dados após mapeamento

### `useGerenciamentoTabelas.js`
**Responsabilidade**: Gerenciamento de tabelas e arquivos SQL
- `obterNomeTabela()` - Determina nome da tabela baseado no banco e empresa
- `procurarArquivoSQL()` - Busca arquivos SQL personalizados
- `executarArquivoSQL()` - Executa comandos SQL (simulado)
- `criarTabelaPadrao()` - Gera SQL para criação de tabela padrão

### `useEnvioExtratos.js`
**Responsabilidade**: Coordenação do processo de envio
- `enviarExtratoBancario()` - Função principal de envio
- `enviarEmLotes()` - Envio de dados em lotes para grandes volumes

### `useBancosSupabase.js`
**Responsabilidade**: Composable principal que mantém compatibilidade
- Importa e combina todos os outros composables
- Mantém a mesma interface da versão anterior
- Garante que código existente continue funcionando

## 🔄 Migração

O arquivo original `../importacao_bancos/useBancosSupabase.js` foi atualizado para redirecionar para esta nova estrutura, mantendo total compatibilidade com código existente.

## 🎯 Vantagens da Componentização

1. **Separação de Responsabilidades**: Cada arquivo tem uma função específica
2. **Facilidade de Manutenção**: Mudanças isoladas em funcionalidades específicas
3. **Reutilização**: Composables podem ser usados independentemente
4. **Testabilidade**: Cada módulo pode ser testado isoladamente
5. **Legibilidade**: Código mais organizado e fácil de entender

## 📖 Como Usar

### Importação Individual
```javascript
import { useValidacaoTabelas } from './Envio_Extratos/useValidacaoTabelas.js'
import { useFormatacaoDados } from './Envio_Extratos/useFormatacaoDados.js'
```

### Importação via Index
```javascript
import { 
  useValidacaoTabelas, 
  useFormatacaoDados,
  useBancosSupabase 
} from './Envio_Extratos/index.js'
```

### Compatibilidade (Recomendado)
```javascript
import { useBancosSupabase } from './Envio_Extratos/useBancosSupabase.js'
// Funciona exatamente como antes, mas com código organizado
```