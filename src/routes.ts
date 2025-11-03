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
router.put("/produtos/:id", ProdutoController.atualizar);

// PEDIDO
// PEDIDOS  (ordem importa!)
router.get("/pedidos", PedidoController.todos);
router.get("/pedidos/:id/itens", PedidoController.itens);
router.post("/pedidos/:id/itens", PedidoController.novoItem);
router.get("/pedidos/:id", PedidoController.obter);
router.post("/pedidos", PedidoController.novo);

//ITENS DO PEDIDO
router.get("/itens/:idVenda", ItemPedidoController.todos);
router.post("/itens", ItemPedidoController.novo);
router.put("/itens/:idVenda/:idProduto", ItemPedidoController.atualizar);
router.delete("/itens/:idVenda/:idProduto", ItemPedidoController.remover);

export { router }; // Exporta o roteador