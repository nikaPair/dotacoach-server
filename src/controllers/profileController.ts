import { Request, Response, NextFunction } from 'express';
import { queryStratzApi } from '../utils/stratzApi';

// Конвертация SteamID64 → SteamAccountId
const getSteamAccountId = (steamId: string): number =>
  Number(BigInt(steamId) - BigInt('76561197960265728'));

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { steamId } = req.params;
    
    if (!steamId) {
      res.status(400).json({ error: 'Steam ID is required' });
      return;
    }
    
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
  } catch (err: any) {
    console.error('getProfile error:', err.message);
    
    if (err.message.includes('API token is missing')) {
      res.status(500).json({ error: 'Server configuration error - API token missing' });
      return;
    }
    
    if (err.message.includes('Timeout')) {
      res.status(504).json({ error: 'Timeout while connecting to Stratz API' });
      return;
    }
    
    if (err.message.includes('Stratz API error')) {
      res.status(502).json({ error: 'Error from Stratz API', details: err.message });
      return;
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};
