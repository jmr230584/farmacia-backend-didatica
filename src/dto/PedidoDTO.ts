

import type { ItemPedidoDTO } from "./ItemPedidoDTO.js";

export interface PedidoDTO {
    idVenda?: number;
    idCliente: number;
    dataVenda?: Date;
    itens: ItemPedidoDTO[];
}