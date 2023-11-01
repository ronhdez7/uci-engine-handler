const express = require("express");
const app = express();
const path = require("path");

app.use(function (req, res, next) {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use("/", express.static(path.join(process.cwd(), "/public")));
app.use("/lc0", express.static(path.join(process.cwd(), "/lc0")));
app.use("/stockfish", express.static(path.join(process.cwd(), "/stockfish")));
app.use("/dist", express.static(path.join(process.cwd(), "/dist")));

app.listen(3000, () => console.log("Server started"));
