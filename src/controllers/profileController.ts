import { Request, Response } from "express";
import { ProfileService } from "../services/profileService";

// Инициализируем сервис профиля
const profileService = new ProfileService();

/**
 * Получение профиля игрока по steamId
 */
export const getProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { steamId } = req.params;

        if (!steamId) {
            res.status(400).json({ error: "Steam ID is required" });
            return;
        }

        // Получаем данные профиля через OpenDota API
        const profile = await profileService.getPlayerProfile(steamId);

        if (!profile) {
            res.status(404).json({ error: "Profile not found" });
            return;
        }

        res.json(profile);
    } catch (err: any) {
        console.error("getProfile error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Получение статистики игрока и истории матчей
 */
export const getPlayerStats = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { steamId } = req.params;

        if (!steamId) {
            res.status(400).json({ error: "Steam ID is required" });
            return;
        }

        // Получаем статистику игрока через сервис
        const statsData = await profileService.getPlayerStats(steamId);

        res.json(statsData);
    } catch (err: any) {
        console.error("getPlayerStats error:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
