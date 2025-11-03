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
 