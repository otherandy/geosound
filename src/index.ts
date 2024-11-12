import express from "express";
import audioRouter from "./routes/audio";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(new Date(), req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send(new Date());
});

app.use("/audio", audioRouter);

export default app;
