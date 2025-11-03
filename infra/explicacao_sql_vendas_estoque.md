# Explicação linha por linha do SQL — Controle de Vendas e Estoque (PostgreSQL)

> Arquivo pronto para **importar no Notion** (Markdown).  
> Dica: Arraste este `.md` para uma página do Notion ou use **Import > Text & Markdown**.

---

## 1) Limpeza inicial (DROP)

```sql
DROP TRIGGER IF EXISTS trg_baixa_estoque ON item_venda;
```
**O que faz:** Remove o *trigger* `trg_baixa_estoque` **se** ele existir na tabela `item_venda`. Evita erro quando o script é reexecutado.

```sql
DROP FUNCTION IF EXISTS fn_baixa_estoque();
```
**O que faz:** Remove a função `fn_baixa_estoque()` **se** existir. Necessário para recriá-la sem conflitos.

```sql
DROP TABLE IF EXISTS item_venda CASCADE;
```
**O que faz:** Apaga a tabela `item_venda` se existir. O `CASCADE` derruba dependências (ex.: *foreign keys*, views dependentes).

```sql
DROP TABLE IF EXISTS venda CASCADE;
```
**O que faz:** Apaga a tabela `venda` caso exista, com *cascade* para dependências.

```sql
DROP TABLE IF EXISTS produto CASCADE;
```
**O que faz:** Apaga a tabela `produto` caso exista, com *cascade* para dependências.

```sql
DROP TABLE IF EXISTS cliente CASCADE;
```
**O que faz:** Apaga a tabela `cliente` caso exista, com *cascade* para dependências.

---

## 2) Criação das tabelas (DDL)

### 2.1) Tabela `cliente`

```sql
CREATE TABLE cliente (
  id_cliente INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL
);
```
- `CREATE TABLE cliente (` — Inicia a definição da tabela `cliente`.
- `id_cliente INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,` — Cria a chave primária, numérica, com geração automática via **IDENTITY** (recomendado no PostgreSQL moderno em vez de `SERIAL`).
- `nome VARCHAR(80) NOT NULL,` — Nome obrigatório, até 80 caracteres.
- `cpf VARCHAR(14) UNIQUE NOT NULL` — CPF obrigatório, com **restrição de unicidade** (não aceita duplicados). Formato típico `000.000.000-00` cabe em 14.
- `);` — Finaliza a criação da tabela.

### 2.2) Tabela `produto`

```sql
CREATE TABLE produto (
  id_produto INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  descricao VARCHAR(120) NOT NULL,
  validade DATE, -- opcional (não usado no alerta aqui)
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  qtd_estoque INTEGER NOT NULL DEFAULT 0 CHECK (qtd_estoque >= 0),
  qtd_min_estoque INTEGER NOT NULL DEFAULT 0 CHECK (qtd_min_estoque >= 0)
);
```
- `id_produto ... IDENTITY PRIMARY KEY` — Identificador autogerado do produto.
- `descricao VARCHAR(120) NOT NULL` — Descrição obrigatória (nome comercial etc.).
- `validade DATE` — Data de validade (opcional). O comentário lembra que não é usada na *view* de alerta deste script.
- `preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0)` — Preço com 2 casas decimais; não pode ser negativo.
- `qtd_estoque INTEGER NOT NULL DEFAULT 0 CHECK (qtd_estoque >= 0)` — Quantidade atual, padrão 0, sem negativos.
- `qtd_min_estoque INTEGER NOT NULL DEFAULT 0 CHECK (qtd_min_estoque >= 0)` — Estoque mínimo aceitável, padrão 0, sem negativos.
- `);` — Fim da tabela.

### 2.3) Tabela `venda`

```sql
CREATE TABLE venda (
  id_venda INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES public.cliente(id_cliente),
  data_venda TIMESTAMP NOT NULL DEFAULT NOW()
);
```
- `id_venda ... IDENTITY PRIMARY KEY` — Identificador da venda (autogerado).
- `id_cliente INTEGER NOT NULL REFERENCES public.cliente(id_cliente)` — *Foreign key* obrigatória para `cliente`. Garante que toda venda pertence a um cliente existente.
- `data_venda TIMESTAMP NOT NULL DEFAULT NOW()` — Data/hora da venda, padrão é o momento da inserção.
- `);` — Conclui a criação.

### 2.4) Tabela `item_venda`

```sql
CREATE TABLE item_venda (
  id_venda INTEGER NOT NULL REFERENCES venda(id_venda),
  id_produto   INTEGER NOT NULL REFERENCES produto(id_produto),
  qtd_produto  INTEGER NOT NULL CHECK (qtd_produto > 0),
  preco_unit   NUMERIC(10,2) NOT NULL CHECK (preco_unit >= 0),
  PRIMARY KEY (id_venda, id_produto)
);
```
- `id_venda ... REFERENCES venda(id_venda)` — Item pertence a uma venda válida.
- `id_produto ... REFERENCES produto(id_produto)` — Item refere-se a um produto válido.
- `qtd_produto INTEGER NOT NULL CHECK (qtd_produto > 0)` — Quantidade vendida, obrigatória e positiva.
- `preco_unit NUMERIC(10,2) NOT NULL CHECK (preco_unit >= 0)` — Preço unitário praticado na venda (pode guardar histórico de preço).
- `PRIMARY KEY (id_venda, id_produto)` — Chave primária **composta**: impede que o mesmo produto seja repetido na mesma venda.

---

## 3) Função e Trigger de baixa de estoque

### 3.1) Função `fn_baixa_estoque()`

```sql
CREATE OR REPLACE FUNCTION fn_baixa_estoque()
RETURNS TRIGGER AS $$
DECLARE
  linhas_atualizadas INTEGER;
BEGIN
  UPDATE produto
     SET qtd_estoque = qtd_estoque - NEW.qtd_produto
   WHERE id_produto = NEW.id_produto
     AND qtd_estoque >= NEW.qtd_produto
  RETURNING 1 INTO linhas_atualizadas;

  IF linhas_atualizadas IS NULL THEN 
    RAISE EXCEPTION
      USING MESSAGE = 'Estoque insuficiente para o produto ' || NEW.id_produto,
            DETAIL  = 'qtd solicitada=' || NEW.qtd_produto;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
- `CREATE OR REPLACE FUNCTION fn_baixa_estoque()` — Cria (ou substitui) a função de *trigger*.
- `RETURNS TRIGGER` — Indica que será usada por um *trigger* de linha.
- `DECLARE` — Início da seção de variáveis locais.
- `linhas_atualizadas INTEGER;` — Variável para saber se o `UPDATE` realmente executou.
- `BEGIN` — Início do bloco executável.
- `UPDATE produto SET qtd_estoque = qtd_estoque - NEW.qtd_produto ...` — Tenta debitar o estoque do produto do item **a ser inserido** (`NEW`):
  - `WHERE id_produto = NEW.id_produto` — Restrito ao produto do item.
  - `AND qtd_estoque >= NEW.qtd_produto` — Só atualiza se houver estoque suficiente.
- `RETURNING 1 INTO linhas_atualizadas;` — Se o `UPDATE` ocorrer, retorna `1` para a variável; caso contrário, continuará `NULL`.
- `IF linhas_atualizadas IS NULL THEN` — Se não atualizou (estoque insuficiente ou produto inexistente)...
- `RAISE EXCEPTION USING MESSAGE ..., DETAIL ...;` — Dispara erro com mensagem amigável. O **INSERT no item** falha, protegendo a consistência.
- `RETURN NEW;` — Permite que o *insert* prossiga quando o débito foi feito.
- `END;` — Fim do corpo da função.
- `LANGUAGE plpgsql;` — Linguagem procedural do PostgreSQL.

### 3.2) Trigger `trg_baixa_estoque`

```sql
CREATE TRIGGER trg_baixa_estoque
BEFORE INSERT ON item_venda
FOR EACH ROW
EXECUTE FUNCTION fn_baixa_estoque();
```
- `CREATE TRIGGER trg_baixa_estoque` — Define um *gatilho* chamado `trg_baixa_estoque`.
- `BEFORE INSERT ON item_venda` — Dispara **antes** de inserir cada item de venda.
- `FOR EACH ROW` — Executa **por linha** (não por instrução).
- `EXECUTE FUNCTION fn_baixa_estoque();` — Chama a função para debitar o estoque.

---

## 4) View de alerta de estoque

```sql
CREATE OR REPLACE VIEW v_produtos_alerta AS
SELECT
  p.id_produto,
  p.descricao,
  p.qtd_estoque,
  p.qtd_min_estoque,
  (p.qtd_estoque <= p.qtd_min_estoque) AS em_alerta
FROM public.produto p
WHERE p.qtd_estoque <= p.qtd_min_estoque;
```
- `CREATE OR REPLACE VIEW v_produtos_alerta AS` — Cria (ou substitui) uma visão nomeada.
- `SELECT ...` — Seleciona campos úteis para o *dashboard*.
- `(p.qtd_estoque <= p.qtd_min_estoque) AS em_alerta` — Coluna booleana **true/false** indicando se está em nível crítico.
- `FROM public.produto p` — Origem dos dados.
- `WHERE p.qtd_estoque <= p.qtd_min_estoque;` — A view já retorna **somente** os itens em alerta (pode facilitar o consumo no front-end).

> **Uso no front-end:** consulte `SELECT * FROM v_produtos_alerta;` para mostrar uma lista de produtos críticos e/ou contar alertas.

---

## 5) Inserção de dados (DML)

### 5.1) Clientes
```sql
INSERT INTO cliente (nome, cpf) VALUES
('Ana Lima',  '123.456.789-01'),
('Bruno Paz', '987.654.321-00');
```
- Insere dois clientes com `nome` e `cpf`. O `id_cliente` é gerado automaticamente.

### 5.2) Produtos
```sql
INSERT INTO produto (descricao, validade, preco, qtd_estoque, qtd_min_estoque) VALUES
('Paracetamol 750mg',  CURRENT_DATE + INTERVAL '180 days', 9.90,  20, 5),
('Dipirona 1g',        CURRENT_DATE + INTERVAL '200 days', 7.50,  10, 4),
('Ibuprofeno 400mg',   CURRENT_DATE + INTERVAL '150 days', 12.00,  6, 3),
('Soro Fisiológico 0,9%', CURRENT_DATE + INTERVAL '365 days', 5.00, 2, 5);  -- já entra em alerta
```
- `CURRENT_DATE + INTERVAL 'XXX days'` — Gera datas de validade no futuro.
- O último produto já nasce **em alerta** (`qtd_estoque = 2` e `qtd_min_estoque = 5`).

---

## 6) Como o fluxo funciona (resumo prático)

1. Crie uma venda em `venda` apontando para um cliente existente.  
2. Insira itens em `item_venda` com `qtd_produto` e `preco_unit`.  
3. A cada item inserido, o **trigger** roda a função:
   - Se houver estoque suficiente, **debita** de `produto.qtd_estoque` e o `INSERT` acontece.
   - Se **não houver**, dispara exceção e o `INSERT` **falha** (você pode `ROLLBACK` no backend).  
4. Consulte `v_produtos_alerta` para exibir/contar itens em **nível crítico**.

---

## 7) Dicas e extensões

- Para impedir estoque negativo mesmo contra *updates* diretos, mantenha o `CHECK` e centralize a baixa **apenas** via `item_venda`.
- Se quiser considerar **validade vencida** na *view*, adicione:  
  ```sql
  (validade IS NOT NULL AND validade < CURRENT_DATE) AS vencido
  ```
  e ajuste o `WHERE` conforme a regra de negócio.

---

## 8) Consultas úteis para testar

```sql
-- Listar produtos e seus estoques
SELECT id_produto, descricao, qtd_estoque, qtd_min_estoque FROM produto ORDER BY id_produto;

-- Ver itens em alerta
SELECT * FROM v_produtos_alerta;

-- Criar uma venda para o cliente 1
INSERT INTO venda (id_cliente) VALUES (1) RETURNING id_venda;

-- Tentar vender 3 unidades do produto 4 (que tem só 2): deve falhar
INSERT INTO item_venda (id_venda, id_produto, qtd_produto, preco_unit)
VALUES (1, 4, 3, 5.00);

-- Vender 2 unidades do produto 4: deve passar e zerar o estoque
INSERT INTO item_venda (id_venda, id_produto, qtd_produto, preco_unit)
VALUES (1, 4, 2, 5.00);
```

---

## 9) Importando no Notion
- **Opção A (arrastar)**: arraste este arquivo `.md` para dentro de uma página do Notion.
- **Opção B (menu)**: Notion > **Import** > **Text & Markdown** > selecione o arquivo.

---

**Fim.**
