# Farmácia Didática

Projeto destinado a ensinar a fazer controle de um estoque, exemplo didático que não é atende totalmente a uma aplicação de mercado, vários atributos foram deixados de lado afim de facilitar e agilizar o processo.

- Pontos tratados:
 - O controle é realizado através de uma TRIGGER no banco
 - VIEW exibe quando algum item está abaixo ou próximo da quantidade minima de estoque
 - Somente rotas necessárias foram criadas
 - arquivo no diretório infra chamado explicacao_sql_vendas_estoque.md pode ser importado ao Notion para melhor vizualização.

- Pontos não tratados:
 - Quando um pedido já realizado, e um item é excluido da venda o item não retorna ao estoque
 - vários atributos foram ignorados
 - comentários não foram realizados
 
- Erros cometidos
 - Nem todos os nomes das tabelas são os mesmos das classes criadas
 

Sua responsabilidade:
- Colocar DTO em todas as classes controller 
  - O que o DTO faz?

- Fazer o DER

- Interface de autenticação de usuário

- Interface principal do sistema 
  - Exibir nome do usuário logado
  - Um meio para o usuário fazer logout, redirecionando à tela de login
  - Um meio de acessar a página Cadastro de Produto
  - Um meio de acessar a página Pedidos
  
- Interface cadastro de produto:
  - Liste os produtos
  - Implementar um campo de busca, quando usuário inserir o termo e confirmar, a lista deve 
    atualizar conforme termo inserido pelo usuário
  - Uma forma para o usuário cadastrar um produto novo
  - Uma forma para o usuário atualizar um produto
  - Uma forma para o usuário efetuar a exclusão de um produto
  - Desenvolver uma forma que possa dar entrada ou saída de produtos do estoque, e 
    registrar essa transação, essa movimentação deve ter a opção de inserir a data (recomendação que seja em uma interface diferente, para manter os registros de entrada e saída de produtos)
  - Uma forma de verificação automática do estoque de remédio, gerando um alerta em caso de
    estoque abaixo do mínimo configurado
  - Uma forma de retornar a Interface principal

- Interface Pedido
  - Listar pedidos em ordem alfábetica pelo cliente
  - Criar pedido
  - Editar pedido