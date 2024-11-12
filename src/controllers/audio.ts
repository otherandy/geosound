import type { Request, Response, NextFunction } from "express";
import type { UploadedFile } from "express-fileupload";

import { distanceBetweenCoordinates } from "../utils";

const pb = new PocketBase(process.env.POCKETBASE_URL);

export async function uploadAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const file = req.files?.audio as UploadedFile;

  if (!file) {
    res.status(400).send({ error: "No file uploaded." });
    return;
  }

  if (!file.mimetype.includes("audio")) {
    res.status(400).send({ error: "Invalid file type." });
    return;
  }

  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    res.status(400).send({ error: "Latitude and longitude required." });
    return;
  }

  const tags = req.body.tags as string[];
  
  const data = {
    file: new File([file.data], file.name),
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    tags: tags === undefined ? [] : tags,
  };

  const record = await pb.collection("audio").create(data);
  res.send(record);
}

export async function getAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
if (Object.keys(req.query).length > 0) {
    searchAudio(req, res, next);
    return;
  }

  const records = await pb.collection("audio").getFullList({
    sort: "-created",
  });

  if (!records) {
    res.status(404).send({ error: "No records found." });
    return;
  }

  res.send(records);
}

async function searchAudio(req: Request, res: Response, next: NextFunction) {
  const { latitude, longitude, radius } = req.query;

  if (!latitude || !longitude || !radius) {
    res.status(400).send({
      error: "Latitude, longitude, and radius required for search.",
    });
    return;
  }

  const records = await pb.collection("audio").getFullList();

  if (!records) {
    res.status(404).send({ error: "No records found." });
    return;
  }

  const results = records.filter((record) => {
    const recordLatitude = parseFloat(record.latitude);
    const recordLongitude = parseFloat(record.longitude);

    const distance = distanceBetweenCoordinates(
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      recordLatitude,
      recordLongitude
    );

    return distance <= parseFloat(radius as string);
  });

  if (results.length === 0) {
    res.status(404).send({ error: "No records found." });
    return;
  }

  res.send(results);
}

export async function getAudioById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const record = await pb.collection("audio").getOne(req.params.id);

  if (!record) {
    res.status(404).send({ error: "Record not found." });
    return;
  }

  res.send(record);
}

export async function updateAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.status(501).send({ error: "Not yet implemented." });
}

export async function deleteAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const success = await pb.collection("audio").delete(req.params.id);

  if (!success) {
    res.status(404).send({ error: "Record not found" });
    return;
  }

  res.send({ success: true });
}
