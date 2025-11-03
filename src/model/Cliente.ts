import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

export class Cliente {
  private idCliente?: number;  
  private nome: string;
  private cpf: string;

  constructor( _nome: string, _cpf: string) {    
    this.nome = _nome;
    this.cpf = _cpf;
  }

  // ========== GETTERS ==========
  public getIdCliente(): number | undefined { return this.idCliente; }
  public getCpf(): string { return this.cpf; }
  public getNome(): string { return this.nome; }

  // ========== SETTERS ==========
  public setIdCliente(_idCliente: number): void { this.idCliente = _idCliente }
  public setCpf(_cpf: string): void { this.cpf = _cpf; }
  public setNome(_nome: string): void { this.nome = _nome; }

  static async listarClientes(): Promise<Array<Cliente> | null> {
    try {
      let listaDeClientes: Array<Cliente> = [];
      const querySelectClientes = `SELECT * FROM cliente;`;

      const respostaBD = await database.query(querySelectClientes);

      // Percorre cada linha retornada pela consulta
      respostaBD.rows.forEach((clienteBD) => {
        // Cria um novo objeto Cliente usando os dados da linha atual (nome, cpf, telefone)
        const novoCliente: Cliente = new Cliente(
          clienteBD.nome,
          clienteBD.cpf
        );

        novoCliente.setIdCliente(clienteBD.id_cliente);
        console.log(novoCliente);
        listaDeClientes.push(novoCliente);

      });

      return listaDeClientes;
    } catch (error) {
      console.error(`Erro na consulta ao banco de dados. ${error}`);
      return null;
    }
  }


  // CREATE
  static async cadastrarCliente(cliente: Cliente): Promise<boolean> {
    try {
      const queryInsertCliente = `INSERT INTO Cliente (nome, cpf)
        VALUES ( $1, $2)      
        RETURNING id_cliente;`;
        
      const result = await database.query(queryInsertCliente, [
        cliente.nome.toUpperCase(),
        cliente.cpf
      ]);

      if (result.rows.length > 0) {
        console.log(`Cliente cadastrado com sucesso. ID: ${result.rows[0].id_cliente}`);
        return true;
      }

      return false;

    } catch (error) {
      console.error(`Erro ao cadastrar cliente: ${error}`);
      return false
    }
  }
} 
