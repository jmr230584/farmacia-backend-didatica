export interface ProdutoDTO {
    idProduto?: number;
    descricao: string;
    validade?: string | null;
    preco: number;
    qtdEstoque: number;
    qtdMinEstoque: number;
}