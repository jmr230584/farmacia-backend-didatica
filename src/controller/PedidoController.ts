import { Pedido, type ItemDTO } from "../model/Pedido.js";
import type { Request, Response } from "express";

class PedidoController extends Pedido {

  static async todos(req: Request, res: Response): Promise<any> {
    try {
      const lista = await Pedido.listarPedidos();
      return res.status(200).json(lista);
    } catch (error) {
      console.error(`Erro ao listar pedidos: ${error}`);
      return res.status(500).json({ mensagem: "Erro ao acessar lista de pedidos." });
    }
  }

  static async obter(req: Request, res: Response): Promise<any> {
    try {
      const idVenda = Number(req.params.id);
      const dados = await Pedido.obterPedidoComItens(idVenda);
      if (!dados) return res.status(404).json({ mensagem: "Pedido não encontrado." });
      return res.status(200).json(dados);
    } catch (error) {
      console.error(`Erro ao obter pedido: ${error}`);
      return res.status(500).json({ mensagem: "Erro ao obter pedido." });
    }
  }

  static async novo(req: Request, res: Response): Promise<any> {
    try {
      const { idCliente, itens } = req.body as { idCliente: number; itens: ItemDTO[] };
      if (!idCliente || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ mensagem: "idCliente e itens são obrigatórios." });
      }
      const idVenda = await Pedido.criarPedidoComItens(Number(idCliente), itens);
      if (!idVenda) return res.status(400).json({ mensagem: "Erro ao criar pedido." });
      return res.status(201).json({ idVenda, mensagem: "Pedido criado com sucesso.", totalItens: itens.length });
    } catch (error: any) {
      const msg = String(error?.message ?? error);
      const isEstoque = msg.toLowerCase().includes("estoque insuficiente");
      console.error(`Erro ao criar pedido: ${msg}`);
      return res.status(isEstoque ? 400 : 500).json({ mensagem: msg });
    }
  }

  static async novoItem(req: Request, res: Response): Promise<any> {
    try {
      const idVenda = Number(req.params.id);
      const { idProduto, qtdProduto, precoUnit } = req.body as ItemDTO;
      if (!idProduto || !qtdProduto || typeof precoUnit !== "number") {
        return res.status(400).json({ mensagem: "idProduto, qtdProduto e precoUnit são obrigatórios." });
      }
      const ok = await Pedido.adicionarItem(idVenda, { idProduto, qtdProduto, precoUnit });
      return ok
        ? res.status(201).json({ mensagem: "Item adicionado com sucesso." })
        : res.status(400).json({ mensagem: "Não foi possível adicionar o item." });
    } catch (error: any) {
      const msg = String(error?.message ?? error);
      const isEstoque = msg.toLowerCase().includes("estoque insuficiente");
      console.error(`Erro ao adicionar item: ${msg}`);
      return res.status(isEstoque ? 400 : 500).json({ mensagem: msg });
    }
  }

  static async itens(req: Request, res: Response): Promise<any> {
    try {
      const idVenda = Number(req.params.id);
      const lista = await Pedido.listarItens(idVenda);
      return res.status(200).json(lista);
    } catch (error) {
      console.error(`Erro ao listar itens do pedido: ${error}`);
      return res.status(500).json({ mensagem: "Erro ao listar itens do pedido." });
    }
  }
}

export default PedidoController;
