import { Router } from "express";
import {
  uploadAudio,
  getAudio,
  getAudioById,
  searchAudio,
  updateAudio,
  deleteAudio,
} from "../controllers/audio";

const router = Router();

router.post("/", uploadAudio);
router.get("/", getAudio);
router.get("/:id", getAudioById);
router.get("/search", searchAudio);
router.put("/:id", updateAudio);
router.delete("/:id", deleteAudio);

export default router;
