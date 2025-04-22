import express from "express";
import {
    getProfile,
    getPlayerStats,
    getHeroes,
} from "../controllers/newProfileController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// Маршруты для профиля пользователя
router.get("/profile/:steamId", getProfile);
router.get("/stats/:steamId", getPlayerStats);
router.get("/heroes", getHeroes);

export default router;
