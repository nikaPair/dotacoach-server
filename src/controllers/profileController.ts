import { Request, Response, NextFunction } from 'express';
import { queryStratzApi } from '../utils/stratzApi';
import axios from 'axios';

// Конвертация SteamID64 → SteamAccountId
const getSteamAccountId = (steamId: string): number =>
  Number(BigInt(steamId) - BigInt('76561197960265728'));

// Резервный метод через OpenDota API
async function getProfileFromOpenDota(steamId: string) {
  try {
    const steamAccountId = getSteamAccountId(steamId);
    
    // Получить основную информацию о пользователе
    const playerResponse = await axios.get(`https://api.opendota.com/api/players/${steamAccountId}`);
    
    if (!playerResponse.data) {
      throw new Error('Player not found');
    }
    
    // Получить последние матчи
    const matchesResponse = await axios.get(`https://api.opendota.com/api/players/${steamAccountId}/matches?limit=10`);
    
    // Форматировать данные в том же формате что и от STRATZ API
    return {
      name: playerResponse.data.profile?.personaname || 'Unknown',
      avatar: playerResponse.data.profile?.avatarfull || '',
      matches: matchesResponse.data.map((match: any) => ({
        matchId: match.match_id,
        didRadiantWin: match.radiant_win,
        durationSeconds: match.duration,
        startDateTime: new Date(match.start_time * 1000).toISOString(),
        heroes: {
          heroId: match.hero_id,
          kills: match.kills,
          deaths: match.deaths,
          assists: match.assists,
          isVictory: (match.player_slot < 128 && match.radiant_win) || 
                    (match.player_slot >= 128 && !match.radiant_win)
        }
      }))
    };
  } catch (error) {
    console.error('Error fetching from OpenDota:', error);
    throw error;
  }
}

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { steamId } = req.params;
    
    if (!steamId) {
      res.status(400).json({ error: 'Steam ID is required' });
      return;
    }
    
    // Сначала попробуем получить данные через OpenDota API
    try {
      console.log(`Getting profile data for ${steamId} using OpenDota API`);
      const playerData = await getProfileFromOpenDota(steamId);
      res.json(playerData);
      return;
    } catch (openDotaError) {
      console.error('OpenDota API failed:', openDotaError);
      // Если OpenDota не смог вернуть данные, пробуем STRATZ API
    }
    
    // Если OpenDota не отработал, пробуем STRATZ
    try {
      console.log(`Getting profile data for ${steamId} using STRATZ API`);
      const steamAccountId = getSteamAccountId(steamId);
      
      const query = `
        query GetPlayerMatches($steamAccountId: Int!) {
          player(steamAccountId: $steamAccountId) {
            steamAccount {
              name
              avatar
            }
            matches(request: { take: 10 }) {
              id
              didRadiantWin
              durationSeconds
              startDateTime
              players {
                steamAccountId
                heroId
                kills
                deaths
                assists
                isVictory
              }
            }
          }
        }
      `;

      const data = await queryStratzApi({
        query,
        variables: { steamAccountId }
      });

      const player = data?.player;
      
      if (!player) {
        res.status(404).json({ error: 'Player not found' });
        return;
      }

      res.json({
        name:    player.steamAccount.name,
        avatar:  player.steamAccount.avatar,
        matches: player.matches.map((m: any) => ({
          matchId:         m.id,
          didRadiantWin:   m.didRadiantWin,
          durationSeconds: m.durationSeconds,
          startDateTime:   m.startDateTime,
          heroes:          m.players.filter((p: any) => p.steamAccountId === steamAccountId).map((p: any) => ({
                             heroId: p.heroId,
                             kills:  p.kills,
                             deaths: p.deaths,
                             assists: p.assists,
                             isVictory: p.isVictory,
                           }))[0]
        }))
      });
    } catch (stratzError: any) {
      console.error('STRATZ API failed:', stratzError.message);
      
      // Оба API не сработали
      if (stratzError.message.includes('API token is missing')) {
        res.status(500).json({ error: 'Server configuration error - API token missing' });
        return;
      }
      
      if (stratzError.message.includes('Timeout')) {
        res.status(504).json({ error: 'Timeout while connecting to API' });
        return;
      }
      
      res.status(502).json({ 
        error: 'Failed to fetch player data', 
        details: stratzError.message
      });
    }
  } catch (err: any) {
    console.error('getProfile error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
