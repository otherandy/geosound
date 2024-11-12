import { Router } from "express";
import {
  uploadAudio,
  getAudio,
  getAudioById,
  updateAudio,
  deleteAudio,
} from "../controllers/audio";

const router = Router();

router.post("/", uploadAudio);
router.get("/", getAudio);
router.get("/:id", getAudioById);
router.put("/:id", updateAudio);
router.delete("/:id", deleteAudio);

export default router;
