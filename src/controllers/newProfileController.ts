import { Request, Response } from "express";
import { ProfileService } from "../services/profileService";

// Инициализируем сервис профиля
const profileService = new ProfileService();

/**
 * Получить профиль пользователя по steamId
 */
export const getProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { steamId } = req.params;

    if (!steamId) {
        res.status(400).json({ error: "SteamID не указан" });
        return;
    }

    try {
        const profile = await profileService.getPlayerProfile(steamId);

        if (!profile || !profile.profile) {
            res.status(404).json({ error: "Профиль не найден" });
            return;
        }

        res.json(profile);
    } catch (error) {
        console.error("Ошибка при получении профиля:", error);
        res.status(500).json({ error: "Ошибка сервера при получении профиля" });
    }
};

/**
 * Получить статистику игрока по steamId
 */
export const getPlayerStats = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { steamId } = req.params;

    if (!steamId) {
        res.status(400).json({ error: "SteamID не указан" });
        return;
    }

    try {
        const stats = await profileService.getPlayerStats(steamId);
        res.json(stats);
    } catch (error) {
        console.error("Ошибка при получении статистики игрока:", error);
        res.status(500).json({
            error: "Ошибка сервера при получении статистики",
        });
    }
};
