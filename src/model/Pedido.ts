import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

export type ItemDTO = {
  idProduto: number;
  qtdProduto: number;
  precoUnit: number;
};

export class Pedido {
  private idVenda?: number;
  private idCliente: number;
  private dataVenda?: Date;

  constructor(_idCliente: number) {
    this.idCliente = _idCliente;    
  }

  // ========== GETTERS ==========
  public getIdVenda(): number | undefined { return this.idVenda; }
  public getIdCliente(): number { return this.idCliente; }
  public getDataVenda(): Date | undefined { return this.dataVenda; }

  // ========== SETTERS ==========
  public setIdCliente(v: number): void { this.idCliente = v; }

  // CREATE (pedido + itens em transação)
  static async criarPedidoComItens(idCliente: number, itens: ItemDTO[]): Promise<number | null> {
    const client = await database.connect();
    try {
      await client.query("BEGIN");

      const qVenda = `
        INSERT INTO venda (id_cliente)
        VALUES ($1)
        RETURNING id_venda;
      `;
      const rVenda = await client.query(qVenda, [idCliente]);
      if (rVenda.rows.length === 0) throw new Error("Falha ao criar pedido");
      const idVenda = Number(rVenda.rows[0].id_venda);

      const qItem = `
        INSERT INTO item_venda (id_venda, id_produto, qtd_produto, preco_unit)
        VALUES ($1, $2, $3, $4)
        RETURNING id_venda;
      `;
      for (const item of itens) {
        await client.query(qItem, [idVenda, item.idProduto, item.qtdProduto, item.precoUnit]);
      }

      await client.query("COMMIT");
      return idVenda;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`Erro ao criar pedido: ${error}`);
      return null;
    } finally {
      client.release();
    }
  }

  static async listarPedidos(): Promise<Array<{
    idVenda: number;
    idCliente: number;
    dataVenda: Date;
  }>> {
    try {
      const q = `
      SELECT
      v.id_venda   AS "idVenda",
      v.id_cliente AS "idCliente",
      v.data_venda AS "dataVenda",
      c.nome       AS "nomeCliente"
      FROM venda v
      JOIN cliente c ON c.id_cliente = v.id_cliente
      ORDER BY v.id_venda DESC;
      `;
      const r = await database.query(q);
      return r.rows as any;
    } catch (error) {
      console.error(`Erro ao listar pedidos: ${error}`);
      return [];
    }
  }

  static async obterPedidoComItens(idVenda: number): Promise<{
    pedido: { idVenda: number; idCliente: number; dataVenda: Date };
    itens: Array<{ idProduto: number; descricao: string; qtdProduto: number; precoUnit: number }>;
  } | null> {
    try {
      const qCab = `
        SELECT
        v.id_venda   AS "idVenda",
        v.id_cliente AS "idCliente",
        v.data_venda AS "dataVenda",
        c.nome       AS "nomeCliente"
        FROM venda v
        JOIN cliente c ON c.id_cliente = v.id_cliente
        WHERE v.id_venda = $1;
      `;
      const qItens = `
        SELECT iv.id_produto  AS "idProduto",
               p.descricao    AS "descricao",
               iv.qtd_produto AS "qtdProduto",
               iv.preco_unit  AS "precoUnit"
          FROM item_venda iv
          JOIN produto p ON p.id_produto = iv.id_produto
         WHERE iv.id_venda = $1
         ORDER BY iv.id_produto;
      `;

      const [cab, itens] = await Promise.all([
        database.query(qCab, [idVenda]),
        database.query(qItens, [idVenda]),
      ]);

      if (cab.rows.length === 0) return null;
      return { pedido: cab.rows[0], itens: itens.rows as any };
    } catch (error) {
      console.error(`Erro ao obter pedido: ${error}`);
      return null;
    }
  }

  static async adicionarItem(idVenda: number, item: ItemDTO): Promise<boolean> {
    try {
      const q = `
        INSERT INTO item_venda (id_venda, id_produto, qtd_produto, preco_unit)
        VALUES ($1, $2, $3, $4)
        RETURNING id_venda;`;

      const r = await database.query(q, [idVenda, item.idProduto, item.qtdProduto, item.precoUnit]);
      return r.rows.length > 0;
      
    } catch (error) {
      console.error(`Erro ao adicionar item: ${error}`);
      return false;
    }
  }

  static async listarItens(idVenda: number): Promise<Array<{
    idProduto: number;
    descricao: string;
    qtdProduto: number;
    precoUnit: number;
  }>> {
    try {
      const q = `
        SELECT iv.id_produto  AS "idProduto",
               p.descricao    AS "descricao",
               iv.qtd_produto AS "qtdProduto",
               iv.preco_unit  AS "precoUnit"
          FROM item_venda iv
          JOIN produto p ON p.id_produto = iv.id_produto
         WHERE iv.id_venda = $1
         ORDER BY iv.id_produto;
      `;
      const r = await database.query(q, [idVenda]);
      return r.rows as any;
    } catch (error) {
      console.error(`Erro ao listar itens do pedido: ${error}`);
      return [];
    }
  }
}
