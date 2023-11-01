let STOCKFISH: any;

export async function initStockfish(): Promise<Worker> {
  const worker =
    typeof STOCKFISH === "function"
      ? STOCKFISH()
      : new Worker("stockfish/stockfish.js#stockfish.wasm");

  return worker;
}
