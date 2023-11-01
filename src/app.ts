import ChessEngine from "./index.js";
import { initLeela } from "./leela.js";
import { initStockfish } from "./stockfish.js";

async function main() {
  // const WEIGHT_URL = "lc0/weights_9155.txt.gz";

  // const engineWorker = await initLeela();
  const engineWorker = await initStockfish();

  const engine = new ChessEngine(engineWorker);
  // engine.onMessage((command, event) => {
  //   console.log(command?.cmd, event);
  // });

  // engine.send(`load ${WEIGHT_URL}`);
  engine.send("uci");
  engine.send("ucinewgame");
  engine.send("position startpos");
  engine.send("go depth 20");
  setTimeout(() => {
    console.log(engine.history);
  }, 3000);
}

window.addEventListener("DOMContentLoaded", main);
// main();
