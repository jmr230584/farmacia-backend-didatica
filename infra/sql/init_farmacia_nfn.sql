-- ===========================
-- LIMPEZA (opcional em dev)
-- ===========================
DROP TRIGGER IF EXISTS trg_baixa_estoque ON item_venda;
DROP FUNCTION IF EXISTS fn_baixa_estoque();

DROP TABLE IF EXISTS item_venda CASCADE;
DROP TABLE IF EXISTS venda CASCADE;
DROP TABLE IF EXISTS produto CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;

-- ===========================
-- TABELAS
-- ===========================

CREATE TABLE cliente (
  id_cliente INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL
);

CREATE TABLE produto (
  id_produto INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  descricao VARCHAR(120) NOT NULL,
  validade DATE, -- opcional (não usado no alerta aqui)
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  qtd_estoque INTEGER NOT NULL DEFAULT 0 CHECK (qtd_estoque >= 0),
  qtd_min_estoque INTEGER NOT NULL DEFAULT 0 CHECK (qtd_min_estoque >= 0)
);

CREATE TABLE venda (
  id_venda INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES public.cliente(id_cliente),
  data_venda TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE item_venda (
  id_venda INTEGER NOT NULL REFERENCES venda(id_venda),
  id_produto   INTEGER NOT NULL REFERENCES produto(id_produto),
  qtd_produto  INTEGER NOT NULL CHECK (qtd_produto > 0),
  preco_unit   NUMERIC(10,2) NOT NULL CHECK (preco_unit >= 0),
  PRIMARY KEY (id_venda, id_produto)
);

-- ===========================
-- TRIGGER: baixa de estoque
-- Regra: ao inserir um item de venda, debita o estoque do produto.
-- Bloqueia se o estoque for insuficiente.
-- ===========================

CREATE OR REPLACE FUNCTION fn_baixa_estoque()
RETURNS TRIGGER AS $$
DECLARE
  linhas_atualizadas INTEGER;
BEGIN
  -- Debita o estoque somente se houver quantidade suficiente
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

CREATE TRIGGER trg_baixa_estoque
BEFORE INSERT ON item_venda
FOR EACH ROW
EXECUTE FUNCTION fn_baixa_estoque();

-- ===========================
-- VIEW: produtos em alerta (estoque <= mínimo)
-- Use no frontend para exibir/contar alertas.
-- ===========================

CREATE OR REPLACE VIEW v_produtos_alerta AS
SELECT
  p.id_produto,
  p.descricao,
  p.qtd_estoque,
  p.qtd_min_estoque,
  (p.qtd_estoque <= p.qtd_min_estoque) AS em_alerta
FROM public.produto p
WHERE p.qtd_estoque <= p.qtd_min_estoque;


-- INSERINDO DADOS

INSERT INTO cliente (nome, cpf) VALUES
('Ana Lima',  '123.456.789-01'),
('Bruno Paz', '987.654.321-00');

INSERT INTO produto (descricao, validade, preco, qtd_estoque, qtd_min_estoque) VALUES
('Paracetamol 750mg',  CURRENT_DATE + INTERVAL '180 days', 9.90,  20, 5),
('Dipirona 1g',        CURRENT_DATE + INTERVAL '200 days', 7.50,  10, 4),
('Ibuprofeno 400mg',   CURRENT_DATE + INTERVAL '150 days', 12.00,  6, 3),
('Soro Fisiológico 0,9%', CURRENT_DATE + INTERVAL '365 days', 5.00, 2, 5);  -- já entra em alerta

