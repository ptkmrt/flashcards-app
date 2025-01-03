import express, { Express } from "express";
import { addDeck, addScore, editDeck, listDecks, listScores, loadDeck, generateDeck } from './routes';
import bodyParser from 'body-parser';


// Configure and start the HTTP server.
const port: number = 8088;
const app: Express = express();
app.use(bodyParser.json());
app.post("/api/add", addDeck);
app.post("/api/generate", generateDeck);
app.post("/api/score", addScore);
app.get("/api/load", loadDeck);
app.get("/api/edit", editDeck);
app.get("/api/listDecks", listDecks);
app.get("/api/listScores", listScores);

app.listen(port, () => console.log(`Server listening on ${port}`));
