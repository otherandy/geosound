import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";

import audioRouter from "./routes/audio";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  fileUpload({
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  })
);

app.use((req, res, next) => {
  console.log(new Date(), req.method, req.url);
  next();
});

app.get("/", (req, res) => {
  res.send(new Date());
});

app.use("/audio", audioRouter);

export default app;
