import { DatabaseModel } from "./model/DatabaseModel.js";
import { server } from "./server.js"

const port: number = 3333; // define a porta que o servidor vai executar

// liga o servidor HTTP
new DatabaseModel().testeConexao().then((resbd) => {
    if (resbd) {
        server.listen(port, () => {
            console.log(`Servidor rodando em http://localhost:${port}`);
        })
    } else {
        console.log('Não foi possível conectar ao banco de dados');
    }
})