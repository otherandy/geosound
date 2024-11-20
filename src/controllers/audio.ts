import type { Request, Response, NextFunction } from "express";
import type { UploadedFile } from "express-fileupload";
import PocketBase, { ClientResponseError } from "pocketbase";

import { distanceBetweenCoordinates } from "../utils";
import type { AudioData } from "../types";

import Meyda from "meyda";
import wav from "node-wav";

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

  if (latitude < -90 || latitude > 90) {
    res.status(400).send({ error: "Latitude must be between -90 and 90." });
    return;
  }

  if (longitude < -180 || longitude > 180) {
    res.status(400).send({ error: "Longitude must be between -180 and 180." });
    return;
  }

  let loudness;
  try {
    const decoded = wav.decode(file.data);
    const data = decoded.channelData[0];
    Meyda.sampleRate = decoded.sampleRate;
    const frames = Math.floor(data.length / 2048);
    const result = [];
    for (let i = 0; i < frames; i++) {
      const start = i * 2048;
      const end = start + 2048;
      const f = data.subarray(start, end);
      const features = Meyda.extract(["loudness"], f);
      const l = features!.loudness?.total;
      if (l) result.push(l);
    }
    loudness = result.reduce((a, b) => a + b, 0) / result.length;
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Error extracting audio features." });
    return;
  }

  const tags = req.body.tags as string;

  const data: AudioData = {
    file: new File([file.data], file.name),
    filename: file.name,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    loudness: loudness || 0,
    tags: tags === undefined ? [] : tags === "" ? [] : tags.split(","),
  };

  let record;
  try {
    record = await pb.collection("audio").create(data);
  } catch (error) {
    if (error instanceof ClientResponseError) {
      res.status(error.status).send({ error: error.message });
      return;
    }

    res.status(500).send({ error: "Internal server error." });
    return;
  }

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

  let records;
  try {
    records = await pb.collection("audio").getFullList({
      sort: "-created",
    });
  } catch (error) {
    if (error instanceof ClientResponseError) {
      res.status(error.status).send({ error: error.message });
      return;
    }

    res.status(500).send({ error: "Internal server error." });
    return;
  }

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

  let records;
  try {
    records = await pb.collection("audio").getFullList({
      sort: "-created",
    });
  } catch (error) {
    if (error instanceof ClientResponseError) {
      res.status(error.status).send({ error: error.message });
      return;
    }

    res.status(500).send({ error: "Internal server error." });
    return;
  }

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
  if (req.query.download) {
    downloadAudio(req, res, next);
    return;
  }

  let record;
  try {
    record = await pb.collection("audio").getOne(req.params.id);
  } catch (error) {
    if (error instanceof ClientResponseError) {
      res.status(error.status).send({ error: error.message });
      return;
    }

    res.status(500).send({ error: "Internal server error." });
    return;
  }

  if (!record) {
    res.status(404).send({ error: "Record not found." });
    return;
  }

  res.send(record);
}

async function downloadAudio(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;

  let record;
  try {
    record = await pb.collection("audio").getOne(id);
  } catch (error) {
    if (error instanceof ClientResponseError) {
      res.status(error.status).send({ error: error.message });
      return;
    }

    res.status(500).send({ error: "Internal server error." });
    return;
  }

  if (!record) {
    res.status(404).send({ error: "Record not found." });
    return;
  }

  const url = `${process.env.POCKETBASE_URL}/api/files/audio/${id}/${record.file}`;

  res.redirect(url);
}

export async function updateAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.body.latitude || !req.body.longitude) {
    res.status(400).send({ error: "Latitude and longitude required." });
    return;
  }

  if (req.body.latitude < -90 || req.body.latitude > 90) {
    res.status(400).send({ error: "Latitude must be between -90 and 90." });
    return;
  }

  if (req.body.longitude < -180 || req.body.longitude > 180) {
    res.status(400).send({ error: "Longitude must be between -180 and 180." });
    return;
  }

  const data = {
    latitude: parseFloat(req.body.latitude),
    longitude: parseFloat(req.body.longitude),
    loudness: req.body.loudness || 0,
    tags: req.body.tags === undefined ? [] : req.body.tags.split(","),
  };

  let record;
  try {
    record = await pb.collection("audio").update(req.params.id, data);
  } catch (error) {
    if (error instanceof ClientResponseError) {
      res.status(error.status).send({ error: error.message });
      return;
    }

    res.status(500).send({ error: "Internal server error." });
    return;
  }

  if (!record) {
    res.status(404).send({ error: "Record not found." });
    return;
  }

  res.send(record);
}

export async function deleteAudio(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let result;
  try {
    result = await pb.collection("audio").delete(req.params.id, {
      headers: {
        Authorization: req.headers.authorization as string,
      },
    });
  } catch (error) {
    if (error instanceof ClientResponseError) {
      res.status(error.status).send({ error: error.message });
      return;
    }

    res.status(500).send({ error: "Internal server error." });
    return;
  }

  if (!result) {
    res.status(404).send({ error: "Record not found." });
    return;
  }

  res.send({ message: "Record deleted." });
}
