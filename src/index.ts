import UCIEngineWorker from "./engineWorker.js";

class ChessEngine extends UCIEngineWorker {
  constructor(worker: Worker) {
    super(worker);
  }
}

export default ChessEngine;
