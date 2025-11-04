import { Router } from "express"; // Importa o módulo Router do express
import type { Request, Response } from "express"; // Importa os módulos de requisição e resposta
import ProdutoController from "./controller/ProdutoController.js";
import PedidoController from "./controller/PedidoController.js";
import ItemPedidoController from "./controller/ItemPedidoController.js";
import ClienteController from "./controller/ClienteController.js";

const router = Router(); // cria uma instância de Router

router.get("/api", (req: Request, res: Response) => {
    res.status(200).json({ mensagem: "Olá, seja bem-vindo!" });
});

// CLIENTES  <= ADICIONE
router.get("/clientes", ClienteController.todos);
router.post("/clientes", ClienteController.novo);

//PRODUTOS
router.get("/produtos", ProdutoController.todos);
router.get("/produtos/alerta", ProdutoController.alerta);
router.post("/produtos", ProdutoController.novo);
router.put("/produtos/:idProduto", ProdutoController.atualizar);

// ========================================================================
// ROTAS DE PEDIDOS E ITENS DE PEDIDO
// ------------------------------------------------------------------------
// A ordem das rotas importa! Isso evita conflito entre /pedidos/:id e /pedidos/:id/itens.
// As rotas abaixo organizam o fluxo completo de pedidos no sistema.
// Cada pedido pode conter vários itens na tabela itens_pedido.
// ========================================================================

// Retorna todos os pedidos cadastrados no sistema.
// Exemplo: GET /pedidos
// Uso comum: listar pedidos na tela inicial.
router.get("/pedidos", PedidoController.todos);

// Retorna todos os itens de um pedido específico.
// Exemplo: GET /pedidos/5/itens
// Busca na tabela itens_pedido todos os produtos associados ao pedido com id = 5.
router.get("/pedidos/:id/itens", PedidoController.itens);

// Adiciona um novo item a um pedido existente.
// Exemplo: POST /pedidos/5/itens
// Corpo (Body JSON): { "id_produto": 3, "quantidade": 2, "preco_unit": 9.90 }
// Insere um registro na tabela itens_pedido vinculado ao pedido com id = 5.
router.post("/pedidos/:id/itens", PedidoController.novoItem);

// Retorna os detalhes de um pedido específico.
// Exemplo: GET /pedidos/5
// Busca as informações principais do pedido (cliente, data, total, status, etc.).
router.get("/pedidos/:id", PedidoController.obter);

// Cria um novo pedido.
// Exemplo: POST /pedidos
// Corpo (Body JSON): { "id_cliente": 2, "data": "2025-11-03", "status": "aberto" }
// Cria um registro na tabela pedidos.
router.post("/pedidos", PedidoController.novo);

// ========================================================================
// ROTAS DE ITENS DO PEDIDO
// ------------------------------------------------------------------------
// Essas rotas controlam o CRUD da tabela itens_pedido, que representa
// os produtos associados a cada venda (ou pedido).
// Cada item de pedido relaciona um produto a uma venda específica.
// ========================================================================

// Lista todos os itens de uma venda específica.
// Exemplo: GET /itens/12
// Retorna todos os produtos que compõem a venda de ID 12,
// com suas quantidades, valores unitários e totais.
router.get("/itens/:idVenda", ItemPedidoController.todos);

// Cadastra um novo item em uma venda.
// Exemplo: POST /itens
// Corpo (Body JSON):
// {
//   "id_venda": 12,
//   "id_produto": 5,
//   "quantidade": 3,
//   "preco_unit": 9.90
// }
// Cria um novo registro na tabela itens_pedido vinculando o produto à venda.
router.post("/itens", ItemPedidoController.novo);

// Atualiza um item específico dentro de uma venda.
// Exemplo: PUT /itens/12/5
// (12 = idVenda, 5 = idProduto)
// Corpo (Body JSON):
// {
//   "quantidade": 4,
//   "preco_unit": 10.00
// }
// Atualiza o item do produto 5 dentro da venda 12 na tabela itens_pedido.
router.put("/itens/:idVenda/:idProduto", ItemPedidoController.atualizar);

// Remove um item específico de uma venda.
// Exemplo: DELETE /itens/12/5
// Exclui da tabela itens_pedido o produto 5 pertencente à venda 12.
// Essa ação normalmente atualiza o total do pedido posteriormente.
router.delete("/itens/:idVenda/:idProduto", ItemPedidoController.remover);

export { router }; // Exporta o roteador