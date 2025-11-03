import { ItemPedido } from "../model/ItemPedido.js";
import type { Request, Response } from "express";

class ItemPedidoController extends ItemPedido {

  static async todos(req: Request, res: Response): Promise<Response> {
    try {
      const idVenda = Number(req.params.idVenda);
      const itens = await ItemPedido.listarPorPedido(idVenda);
      return res.status(200).json(itens);
    } catch (error) {
      console.error(`Erro ao listar itens: ${error}`);
      return res.status(500).json({ mensagem: "Erro ao listar itens do pedido." });
    }
  }

  static async novo(req: Request, res: Response): Promise<Response> {
    try {
      const dados = req.body;
      const item = new ItemPedido(
        dados.idVenda,
        dados.idProduto,
        dados.qtdProduto,
        dados.precoUnit
      );
      const ok = await ItemPedido.cadastrarItem(item);

      return ok
        ? res.status(201).json({ mensagem: "Item adicionado com sucesso." })
        : res.status(400).json({ mensagem: "Erro ao adicionar item." });
    } catch (error: any) {
      const msg = String(error?.message ?? error);
      const isEstoque = msg.toLowerCase().includes("estoque insuficiente");
      console.error(`Erro ao adicionar item: ${msg}`);
      return res.status(isEstoque ? 400 : 500).json({ mensagem: msg });
    }
  }

  static async atualizar(req: Request, res: Response): Promise<Response> {
    try {
      const idVenda = Number(req.params.idVenda);
      const idProduto = Number(req.params.idProduto);
      const campos = req.body;
      const ok = await ItemPedido.atualizarItem(idVenda, idProduto, campos);

      return ok
        ? res.status(200).json({ mensagem: "Item atualizado com sucesso." })
        : res.status(400).json({ mensagem: "Erro ao atualizar item." });
    } catch (error) {
      console.error(`Erro ao atualizar item: ${error}`);
      return res.status(500).json({ mensagem: "Erro ao atualizar item." });
    }
  }

  static async remover(req: Request, res: Response): Promise<Response> {
    try {
      const idVenda = Number(req.params.idVenda);
      const idProduto = Number(req.params.idProduto);
      const ok = await ItemPedido.removerItem(idVenda, idProduto);

      return ok
        ? res.status(200).json({ mensagem: "Item removido com sucesso." })
        : res.status(400).json({ mensagem: "Erro ao remover item." });
    } catch (error) {
      console.error(`Erro ao remover item: ${error}`);
      return res.status(500).json({ mensagem: "Erro ao remover item." });
    }
  }
}

export default ItemPedidoController;
