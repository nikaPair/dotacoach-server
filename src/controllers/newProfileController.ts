import { Request, Response } from "express";
import { ProfileService, getSteamAccountId } from "../services/profileService";

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
        console.log(`[getProfile] Запрос профиля для steamId: ${steamId}`);
        const profile = await profileService.getPlayerProfile(steamId);

        if (!profile || !profile.profile) {
            console.log(`[getProfile] Профиль не найден для steamId: ${steamId}`);
            res.status(404).json({ 
                error: "Профиль не найден",
                message: "Убедитесь, что указан правильный SteamID и профиль не скрыт настройками приватности" 
            });
            return;
        }

        // Добавляем полезную информацию в ответ
        const responseData = {
            ...profile,
            _links: {
                openDotaProfile: `https://www.opendota.com/players/${profile.profile.account_id}`,
                matches: `/api/stats/${steamId}`
            }
        };

        console.log(`[getProfile] Профиль успешно получен для steamId: ${steamId} (${profile.profile.personaname})`);
        res.json(responseData);
    } catch (error) {
        console.error(`[getProfile] Ошибка при получении профиля для steamId: ${steamId}:`, error);
        res.status(500).json({ 
            error: "Ошибка сервера при получении профиля",
            message: "Пожалуйста, повторите попытку позже"
        });
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
        console.log(`[getPlayerStats] Запрос статистики для steamId: ${steamId}`);
        const stats = await profileService.getPlayerStats(steamId);
        
        // Добавляем полезную информацию в ответ
        const responseData = {
            ...stats,
            _links: {
                profile: `/api/profile/${steamId}`,
                openDotaStats: `https://www.opendota.com/players/${getSteamAccountId(steamId)}/overview`
            }
        };
        
        console.log(`[getPlayerStats] Статистика успешно получена для steamId: ${steamId} (${stats.recentMatches.length} матчей)`);
        res.json(responseData);
    } catch (error) {
        console.error(`[getPlayerStats] Ошибка при получении статистики для steamId: ${steamId}:`, error);
        res.status(500).json({
            error: "Ошибка сервера при получении статистики",
            message: "Пожалуйста, повторите попытку позже"
        });
    }
};

/**
 * Получить данные о всех героях
 */
export const getHeroes = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        console.log(`[getHeroes] Запрос данных о героях`);
        const heroesData = await profileService.getHeroesData();
        
        console.log(`[getHeroes] Данные о героях успешно получены (${Object.keys(heroesData).length} героев)`);
        res.json(heroesData);
    } catch (error) {
        console.error(`[getHeroes] Ошибка при получении данных о героях:`, error);
        res.status(500).json({
            error: "Ошибка сервера при получении данных о героях",
            message: "Пожалуйста, повторите попытку позже"
        });
    }
};
