// src/model/ItemPedido.ts
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

export class ItemPedido {
  private idVenda: number;
  private idProduto: number;
  private qtdProduto: number;
  private precoUnit: number;

  constructor(_idVenda: number, _idProduto: number, _qtdProduto: number, _precoUnit: number) {
    this.idVenda = _idVenda;
    this.idProduto = _idProduto;
    this.qtdProduto = _qtdProduto;
    this.precoUnit = _precoUnit;
  }

  // ========== GETTERS ==========
  public getIdVenda(): number { return this.idVenda; }
  public getIdProduto(): number { return this.idProduto; }
  public getQtdProduto(): number { return this.qtdProduto; }
  public getPrecoUnit(): number { return this.precoUnit; }

  // ========== SETTERS ==========
  public setIdVenda(v: number): void { this.idVenda = v; }
  public setIdProduto(v: number): void { this.idProduto = v; }
  public setQtdProduto(v: number): void { this.qtdProduto = v; }
  public setPrecoUnit(v: number): void { this.precoUnit = v; }

  // CREATE
  static async cadastrarItem(item: ItemPedido): Promise<boolean> {
    try {
      const query = `
        INSERT INTO item_venda (id_venda, id_produto, qtd_produto, preco_unit)
        VALUES ($1, $2, $3, $4)
        RETURNING id_venda, id_produto;
      `;
      const params = [
        item.idVenda,
        item.idProduto,
        item.qtdProduto,
        item.precoUnit
      ];
      const result = await database.query(query, params);

      if (result.rows.length > 0) {
        console.log(
          `Item incluído: venda=${result.rows[0].id_venda}, produto=${result.rows[0].id_produto}`
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Erro ao cadastrar item do pedido: ${error}`);
      return false;
    }
  }

  // LISTAR: itens por pedido (com descrição do produto)
  static async listarPorPedido(idVenda: number): Promise<Array<{
    idProduto: number;
    descricao: string;
    qtdProduto: number;
    precoUnit: number;
  }>> {
    try {
      const query = `
        SELECT
          iv.id_produto  AS "idProduto",
          p.descricao    AS "descricao",
          iv.qtd_produto AS "qtdProduto",
          iv.preco_unit  AS "precoUnit"
        FROM item_venda iv
        JOIN produto p ON p.id_produto = iv.id_produto
        WHERE iv.id_venda = $1
        ORDER BY iv.id_produto;
      `;
      const result = await database.query(query, [idVenda]);
      return result.rows as any;
    } catch (error) {
      console.error(`Erro ao listar itens do pedido: ${error}`);
      return [];
    }
  }

  // UPDATE PARCIAL: qtdProduto e/ou precoUnit
  static async atualizarItem(
    idVenda: number,
    idProduto: number,
    campos: Partial<{ qtdProduto: number; precoUnit: number; }>
  ): Promise<boolean> {
    try {
      const sets: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (typeof campos.qtdProduto === "number") {
        sets.push(`qtd_produto = $${idx++}`);
        params.push(campos.qtdProduto);
      }
      if (typeof campos.precoUnit === "number") {
        sets.push(`preco_unit = $${idx++}`);
        params.push(campos.precoUnit);
      }

      if (sets.length === 0) {
        console.warn("Nenhum campo para atualizar em ItemPedido.");
        return false;
      }

      const query = `
        UPDATE item_venda
           SET ${sets.join(", ")}
         WHERE id_venda = $${idx} AND id_produto = $${idx + 1}
         RETURNING id_venda, id_produto;
      `;
      params.push(idVenda, idProduto);

      const result = await database.query(query, params);
      if (result.rows.length > 0) {
        console.log(
          `Item atualizado: venda=${result.rows[0].id_venda}, produto=${result.rows[0].id_produto}`
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Erro ao atualizar item do pedido: ${error}`);
      return false;
    }
  }

  // DELETE
  static async removerItem(idVenda: number, idProduto: number): Promise<boolean> {
    try {
      const query = `
        DELETE FROM item_venda
         WHERE id_venda = $1 AND id_produto = $2
         RETURNING id_venda, id_produto;
      `;
      const result = await database.query(query, [idVenda, idProduto]);

      if (result.rows.length > 0) {
        console.log(
          `Item removido: venda=${result.rows[0].id_venda}, produto=${result.rows[0].id_produto}`
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Erro ao remover item do pedido: ${error}`);
      return false;
    }
  }
}
