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
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude || !radius) {
      res.status(400).send({
        error: "Latitude, longitude, and radius required for search.",
      });
      return;
    }

    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    const rad = parseFloat(radius as string);

    const { status, data } = await searchAudio(lat, lon, rad);
    res.status(status).send(data);
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

async function searchAudio(
  latitude: number,
  longitude: number,
  radius: number
) {
  const records = await pb.collection("audio").getFullList();

  if (!records) {
    return { status: 404, data: { error: "No records found." } };
  }

  const results = records.filter((record) => {
    const recordLatitude = parseFloat(record.latitude);
    const recordLongitude = parseFloat(record.longitude);

    const distance = distanceBetweenCoordinates(
      latitude,
      longitude,
      recordLatitude,
      recordLongitude
    );

    return distance <= radius;
  });

  return { status: 200, data: results };
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
