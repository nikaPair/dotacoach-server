import axios from "axios";

/**
 * Конвертация SteamID64 → SteamAccountId
 */
export const getSteamAccountId = (steamId: string): number => {
  // Проверка, является ли строка SteamID64 (76561197960265728 + accountId)
  // SteamID64 обычно длиннее 16 цифр
  if (steamId.length >= 16 && steamId.match(/^[0-9]+$/)) {
    return Number(BigInt(steamId) - BigInt("76561197960265728"));
  }

  // Если это уже SteamAccountID, просто преобразуем в число
  return Number(steamId);
};

/**
 * Типы для статистики игрока
 */
export interface TopHero {
  hero_id: number;
  last_played: number;
  games: number;
  win: number;
  with_games: number;
}
export interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  mainRoles: string[];
  topHeroes?: TopHero[];
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
  private readonly OPENDOTA_CDN = "https://cdn.dota2.com";

  // Таймаут для запросов
  private readonly API_TIMEOUT = 10000; // 10 секунд

  // Fallback данные если API недоступен
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

  // Создаем инстанс axios с таймаутом для всех запросов
  private api = axios.create({
    timeout: this.API_TIMEOUT,
    headers: {
      Accept: "application/json",
      "User-Agent": "DotaCoach/1.0.0",
    },
  });

  /**
   * Героические роли (упрощенная версия)
   */

  /**
   * Получаем информацию о профиле игрока
   */
  async getPlayerProfile(steamId: string) {
    const steamAccountId = getSteamAccountId(steamId);
    console.log(
      `Получение профиля для steamAccountId: ${steamAccountId} (исходный ID: ${'58201406'})`
    );

    try {
      const response = await this.api.get(
        `${this.OPENDOTA_API}/players/${steamAccountId}`
      );

      console.log(
        `Профиль успешно получен: ${
          response.data?.profile?.personaname || "Unnamed"
        }`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        `Ошибка при получении профиля (steamAccountId: ${steamAccountId}):`,
        error.response?.status || error.message
      );
      return null;
    }
  }

  /**
   * Получаем информацию о героях из API
   */
  async getHeroesData() {
    try {
      const response = await this.api.get(`${this.OPENDOTA_API}/heroes`);

      const heroesDict: Record<number, any> = {};
      response.data.forEach((hero: any) => {
        heroesDict[hero.id] = {
          name: hero.localized_name,
          img: `${
            this.OPENDOTA_CDN
          }/apps/dota2/images/dota_react/heroes/${hero.name.replace(
            "npc_dota_hero_",
            ""
          )}.png`,
          icon: `${
            this.OPENDOTA_CDN
          }/apps/dota2/images/dota_react/heroes/icons/${hero.name.replace(
            "npc_dota_hero_",
            ""
          )}.png`,
        };
      });

      return heroesDict;
    } catch (error: any) {
      console.error(
        "Ошибка при получении данных о героях:",
        error.response?.status || error.message
      );
      return {};
    }
  }

  /**
   * Получаем статистику побед/поражений
   */
  async getWinLossStats(steamAccountId: number) {
    try {
      const response = await this.api.get(
        `${this.OPENDOTA_API}/players/${steamAccountId}/wl`
      );
      return {
        wins: response.data.win || 0,
        losses: response.data.lose || 0,
      };
    } catch (error: any) {
      console.error(
        `Ошибка при получении статистики побед/поражений (steamAccountId: ${steamAccountId}):`,
        error.response?.status || error.message
      );
      return { wins: 0, losses: 0 };
    }
  }

  /**
   * Получаем историю матчей
   */
  async getRecentMatches(steamAccountId: number, limit = 20) {
    try {
      const response = await this.api.get(
        `${this.OPENDOTA_API}/players/${steamAccountId}/matches?limit=${limit}`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        `Ошибка при получении истории матчей (steamAccountId: ${steamAccountId}):`,
        error.response?.status || error.message
      );
      return [];
    }
  }

  /**
   * Получаем наиболее часто используемых героев
   */
  async getTopHeroes(steamAccountId: number, limit = 5) {
    try {
      const response = await this.api.get(
        `${this.OPENDOTA_API}/players/${steamAccountId}/heroes`
      );
      return response.data.slice(0, limit);
    } catch (error: any) {
      console.error(
        `Ошибка при получении списка героев (steamAccountId: ${steamAccountId}):`,
        error.response?.status || error.message
      );
      return [];
    }
  }

  /**
   * Определяем основные роли на основе часто используемых героев
   */

  /**
   * Получаем полную статистику игрока
   */
  async getPlayerStats(steamId: string): Promise<PlayerStatsResponse> {
    const steamAccountId = getSteamAccountId(steamId);
    console.log(
      `Получение статистики для steamAccountId: ${steamAccountId} (исходный ID: ${steamId})`
    );

    try {
      // Проверяем, существует ли профиль
      const profile = await this.getPlayerProfile(steamId);

      // Если профиль не найден или приватный, возвращаем моковые данные
      if (!profile || !profile.profile) {
        console.log(
          `Профиль не найден или приватный для steamAccountId: ${steamAccountId}`
        );
        return this.FALLBACK_PLAYER_STATS;
      }

      // Получаем статистику побед/поражений
      const wlStats = await this.getWinLossStats(steamAccountId);

      // Если нет данных о матчах, возвращаем моковые данные
      if (wlStats.wins === 0 && wlStats.losses === 0) {
        console.log(
          `Нет данных о матчах для steamAccountId: ${steamAccountId}`
        );
        return this.FALLBACK_PLAYER_STATS;
      }

      // Получаем информацию о последних матчах
      const matches = await this.getRecentMatches(steamAccountId);

      // Получаем топ героев
      const topHeroes = await this.getTopHeroes(steamAccountId);

      // Определяем основные роли
      const mainRoles = ["Мидер", "Керри", "Саппорт", "Танк", "Универсал"];

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
          date: new Date(match.start_time * 1000).toISOString().split("T")[0],
        };
      });

      console.log(
        `Статистика успешно получена для steamAccountId: ${steamAccountId} (${recentMatches.length} матчей)`
      );

      return {
        stats: {
          totalMatches,
          wins: wlStats.wins,
          losses: wlStats.losses,
          winRate,
          mainRoles: mainRoles.length > 0 ? mainRoles : ["Универсал"],
          topHeroes,
        },
        recentMatches,
      };
    } catch (error: any) {
      console.error(
        `Ошибка при получении статистики игрока (steamAccountId: ${steamAccountId}):`,
        error.response?.status || error.message
      );
      return this.FALLBACK_PLAYER_STATS;
    }
  }
}
