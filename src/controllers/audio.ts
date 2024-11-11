import type { Request, Response, NextFunction } from "express";

export async function uploadAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(501).send({ error: "Not yet implemented" });
}

export async function getAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(501).send({ error: "Not yet implemented" });
}

export async function getAudioById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(501).send({ error: "Not yet implemented" });
}

export async function searchAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(501).send({ error: "Not yet implemented" });
}

export async function updateAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(501).send({ error: "Not yet implemented" });
}

export async function deleteAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(501).send({ error: "Not yet implemented" });
}
