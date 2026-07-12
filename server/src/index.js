import express from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

const app = express();
const port = 8000;

app.use(
  cors({
    origin: process.env.CLIENT_URL, 
    credentials: true, 
  })
);


app.all("/api/auth/*", toNodeHandler(auth)); 


app.use(express.json());


app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  res.json(session);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
