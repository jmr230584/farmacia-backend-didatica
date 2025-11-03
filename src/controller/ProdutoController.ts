import { Produto } from "../model/Produto.js";
import type { Request, Response } from "express";

class ProdutoController extends Produto {

    static async todos(req: Request, res: Response): Promise<Response> {
        try {
            const listaProdutos = await Produto.listarTodosProdutos();
            return res.status(200).json(listaProdutos);
        } catch (error) {
            console.error(`Erro ao listar produtos: ${error}`);
            return res.status(500).json({ mensagem: "Erro ao acessar lista de produtos." });
        }
    }

    static async alerta(req: Request, res: Response): Promise<Response> {
        try {
            const produtosEmAlerta = await Produto.listarProdutosEmAlerta();
            return res.status(200).json(produtosEmAlerta);
        } catch (error) {
            console.error(`Erro ao listar produtos em alerta: ${error}`);
            return res.status(500).json({ mensagem: "Erro ao acessar produtos em alerta." });
        }
    }

    static async novo(req: Request, res: Response): Promise<Response> {
        try {
            const dadosRecebidos = req.body;
            const produto = new Produto(
                dadosRecebidos.descricao,
                dadosRecebidos.preco,
                dadosRecebidos.qtdEstoque,
                dadosRecebidos.qtdMinEstoque,
                dadosRecebidos.validade
            );
            const respostaModelo = await Produto.cadastrarProduto(produto);

            if (respostaModelo) {
                return res.status(201).json({ mensagem: "Produto cadastrado com sucesso." });
            } else {
                return res.status(400).json({ mensagem: "Erro ao cadastrar produto." });
            }
        } catch (error) {
            console.error(`Erro ao cadastrar produto: ${error}`);
            return res.status(500).json({ mensagem: "Erro ao inserir produto." });
        }
    }

    static async atualizar(req: Request, res: Response): Promise<Response> {
        try {
            const idProduto = Number(req.params.id);
            const campos = req.body;
            const atualizado = await Produto.atualizarProduto(idProduto, campos);

            if (atualizado) {
                return res.status(200).json({ mensagem: "Produto atualizado com sucesso." });
            } else {
                return res.status(400).json({ mensagem: "Erro ao atualizar produto." });
            }
        } catch (error) {
            console.error(`Erro ao atualizar produto: ${error}`);
            return res.status(500).json({ mensagem: "Erro ao atualizar produto." });
        }
    }
}

export default ProdutoController;
