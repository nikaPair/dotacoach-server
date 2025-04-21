import express, { Request, Response, NextFunction } from "express";
import { getAnalytics } from "../controllers/analiticsController";
import Player from "../models/Player";

const router = express.Router();

// Корневой маршрут должен быть первым
router.get("/", (req: Request, res: Response) => {
    console.log("Accessing root analytics route");
    res.json({ message: "Analytics API is working" });
});

// Маршрут для создания тестовых данных
router.post(
    "/create-test",
    function (req: Request, res: Response, next: NextFunction) {
        console.log("Accessing create-test route");
        (async function () {
            try {
                const testPlayer = new Player({
                    steamId: "12345",
                    mmr: 3000,
                    stats: {
                        farmEfficiency: 75,
                        visionScore: 85,
                    },
                });

                await testPlayer.save();
                console.log("Test player created successfully");
                res.status(201).json({
                    message: "Test player created",
                    player: testPlayer,
                });
            } catch (error: any) {
                console.error("Error creating test player:", error);
                if (error.code === 11000) {
                    // Duplicate key error
                    return res
                        .status(400)
                        .json({ message: "Test player already exists" });
                }
                next(error);
            }
        })();
    }
);

// Маршрут с параметром должен быть последним
router.get("/:steamId", (req: Request, res: Response, next: NextFunction) => {
    console.log(`Accessing steamId route with id: ${req.params.steamId}`);
    try {
        getAnalytics(req, res);
    } catch (error) {
        console.error("Error in analytics route:", error);
        next(error);
    }
});

export default router;
