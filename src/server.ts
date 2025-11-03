import express from "express"; // importa o pacote express
import cors from "cors"; // importa o pacote CORS
import { router } from "./routes.js";   // importa a configuração das rotas

const server = express(); // Cria um servidor HTTP
server.use(cors()); // Configura o servidor para usar o CORS
server.use(express.json()); // configura o servidor para usar JSON
server.use(router); // adiciona as rotas ao servidor HTTP

export { server }; // exporta o servidor