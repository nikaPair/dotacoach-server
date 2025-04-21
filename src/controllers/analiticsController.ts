import { Request, Response } from "express";
import Player from "../models/Player";

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        console.log(
            `Controllers: Fetching analytics for steamId: ${req.params.steamId}`
        );

        // Проверка параметра steamId
        if (!req.params.steamId) {
            console.log("Controllers: SteamId parameter is missing");
            return res
                .status(400)
                .json({ message: "SteamId parameter is required" });
        }

        // Хардкоженые данные для тестирования
        if (req.params.steamId === "12345") {
            console.log("Controllers: Returning test data for steamId 12345");
            return res.json({
                farmEfficiency: 75,
                visionScore: 85,
            });
        }

        // Поиск игрока в базе данных
        console.log(
            `Controllers: Finding player with steamId: ${req.params.steamId}`
        );
        const player = await Player.findOne({ steamId: req.params.steamId });

        if (!player) {
            console.log(
                `Controllers: Player with steamId ${req.params.steamId} not found`
            );
            return res.status(404).json({ message: "Player not found" });
        }

        if (!player.stats) {
            console.log(
                `Controllers: No stats found for player with steamId ${req.params.steamId}`
            );
            return res
                .status(400)
                .json({ message: "Player stats not available" });
        }

        console.log(
            `Controllers: Returning stats for steamId ${req.params.steamId}:`,
            player.stats
        );
        return res.json(player.stats);
    } catch (error: any) {
        console.error(
            `Controllers: Error fetching analytics for steamId ${req.params.steamId}:`,
            error
        );
        return res.status(500).json({
            message: "Server error",
            error: error.message,
            stack: error.stack,
        });
    }
};
