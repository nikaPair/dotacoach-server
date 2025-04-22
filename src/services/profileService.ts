import axios from "axios";

/**
 * Конвертация SteamID64 → SteamAccountId
 */
export const getSteamAccountId = (steamId: string): number =>
    Number(BigInt(steamId) - BigInt("76561197960265728"));

/**
 * Типы для статистики игрока
 */
export interface PlayerStats {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    mainRoles: string[];
}

/**
 * Типы для матча
 */
export interface Match {
    id: string;
    result: "win" | "loss";
    hero: string;
    heroIcon: string;
    heroImg: string;
    kills: number;
    deaths: number;
    assists: number;
    date: string;
}

/**
 * Типы для ответа на запрос статистики
 */
export interface PlayerStatsResponse {
    stats: PlayerStats;
    recentMatches: Match[];
}

/**
 * Сервис для получения статистики игрока через OpenDota API
 */
export class ProfileService {
    // API URLs
    private readonly OPENDOTA_API = "https://api.opendota.com/api";
    private readonly FALLBACK_PLAYER_STATS: PlayerStatsResponse = {
        stats: {
            totalMatches: 245,
            wins: 132,
            losses: 113,
            winRate: 53.8,
            mainRoles: ["Мидер", "Керри"],
        },
        recentMatches: [
            {
                id: "1",
                result: "win",
                hero: "Pudge",
                heroIcon: "",
                heroImg: "",
                kills: 12,
                deaths: 6,
                assists: 15,
                date: "2023-04-21",
            },
            // ... остальные моковые матчи
        ],
    };

    /**
     * Героические роли (упрощенная версия)
     */
    private heroRoles: Record<number, string[]> = {
        1: ["Керри"], // Anti-Mage
        2: ["Мидер"], // Axe
        // ... и т.д.
    };

    /**
     * Получаем информацию о профиле игрока
     */
    async getPlayerProfile(steamId: string) {
        const steamAccountId = getSteamAccountId(steamId);

        try {
            const response = await axios.get(
                `${this.OPENDOTA_API}/players/${steamAccountId}`
            );
            return response.data;
        } catch (error) {
            console.error("Ошибка при получении профиля:", error);
            return null;
        }
    }

    /**
     * Получаем информацию о героях из API
     */
    async getHeroesData() {
        try {
            const response = await axios.get(`${this.OPENDOTA_API}/heroes`);

            const heroesDict: Record<number, any> = {};
            response.data.forEach((hero: any) => {
                heroesDict[hero.id] = {
                    name: hero.localized_name,
                    img: `https://api.opendota.com${hero.img}`,
                    icon: `https://api.opendota.com${hero.icon}`,
                };
            });

            return heroesDict;
        } catch (error) {
            console.error("Ошибка при получении данных о героях:", error);
            return {};
        }
    }

    /**
     * Получаем статистику побед/поражений
     */
    async getWinLossStats(steamAccountId: number) {
        try {
            const response = await axios.get(
                `${this.OPENDOTA_API}/players/${steamAccountId}/wl`
            );
            return {
                wins: response.data.win || 0,
                losses: response.data.lose || 0,
            };
        } catch (error) {
            console.error(
                "Ошибка при получении статистики побед/поражений:",
                error
            );
            return { wins: 0, losses: 0 };
        }
    }

    /**
     * Получаем историю матчей
     */
    async getRecentMatches(steamAccountId: number, limit = 20) {
        try {
            const response = await axios.get(
                `${this.OPENDOTA_API}/players/${steamAccountId}/matches?limit=${limit}`
            );
            return response.data;
        } catch (error) {
            console.error("Ошибка при получении истории матчей:", error);
            return [];
        }
    }

    /**
     * Получаем наиболее часто используемых героев
     */
    async getTopHeroes(steamAccountId: number, limit = 5) {
        try {
            const response = await axios.get(
                `${this.OPENDOTA_API}/players/${steamAccountId}/heroes`
            );
            return response.data.slice(0, limit);
        } catch (error) {
            console.error("Ошибка при получении списка героев:", error);
            return [];
        }
    }

    /**
     * Определяем основные роли на основе часто используемых героев
     */
    determineMainRoles(heroes: any[]): string[] {
        const roleCount: Record<string, number> = {};

        heroes.forEach((hero) => {
            const heroId = hero.hero_id;
            const roles = this.heroRoles[heroId] || ["Универсал"];

            roles.forEach((role) => {
                roleCount[role] = (roleCount[role] || 0) + 1;
            });
        });

        // Сортировка ролей по частоте использования
        const sortedRoles = Object.entries(roleCount)
            .sort((a, b) => b[1] - a[1])
            .map((entry) => entry[0]);

        // Если нет ролей, используем "Универсал"
        if (sortedRoles.length === 0) {
            return ["Универсал"];
        }

        // Возвращаем до 2 основных ролей
        return sortedRoles.slice(0, 2);
    }

    /**
     * Получаем полную статистику игрока
     */
    async getPlayerStats(steamId: string): Promise<PlayerStatsResponse> {
        const steamAccountId = getSteamAccountId(steamId);

        try {
            // Проверяем, существует ли профиль
            const profile = await this.getPlayerProfile(steamId);

            // Если профиль не найден или приватный, возвращаем моковые данные
            if (!profile || !profile.profile) {
                console.log("Профиль не найден или приватный");
                return this.FALLBACK_PLAYER_STATS;
            }

            // Получаем статистику побед/поражений
            const wlStats = await this.getWinLossStats(steamAccountId);

            // Если нет данных о матчах, возвращаем моковые данные
            if (wlStats.wins === 0 && wlStats.losses === 0) {
                console.log("Нет данных о матчах");
                return this.FALLBACK_PLAYER_STATS;
            }

            // Получаем информацию о последних матчах
            const matches = await this.getRecentMatches(steamAccountId);

            // Получаем топ героев
            const topHeroes = await this.getTopHeroes(steamAccountId);

            // Определяем основные роли
            const mainRoles = this.determineMainRoles(topHeroes);

            // Получаем данные о героях для иконок
            const heroesData = await this.getHeroesData();

            // Формируем статистику
            const totalMatches = wlStats.wins + wlStats.losses;
            const winRate =
                totalMatches > 0
                    ? Math.round((wlStats.wins / totalMatches) * 1000) / 10
                    : 0;

            // Форматируем матчи с иконками
            const recentMatches = matches.map((match: any) => {
                const isWin =
                    (match.player_slot < 128 && match.radiant_win) ||
                    (match.player_slot >= 128 && !match.radiant_win);

                const heroId = match.hero_id;
                const heroInfo = heroesData[heroId] || {};

                return {
                    id: match.match_id.toString(),
                    result: isWin ? "win" : "loss",
                    hero: heroInfo.name || `Герой ${heroId}`,
                    heroIcon: heroInfo.icon || "",
                    heroImg: heroInfo.img || "",
                    kills: match.kills || 0,
                    deaths: match.deaths || 0,
                    assists: match.assists || 0,
                    date: new Date(match.start_time * 1000)
                        .toISOString()
                        .split("T")[0],
                };
            });

            return {
                stats: {
                    totalMatches,
                    wins: wlStats.wins,
                    losses: wlStats.losses,
                    winRate,
                    mainRoles: mainRoles.length > 0 ? mainRoles : ["Универсал"],
                },
                recentMatches,
            };
        } catch (error) {
            console.error("Ошибка при получении статистики игрока:", error);
            return this.FALLBACK_PLAYER_STATS;
        }
    }
}
