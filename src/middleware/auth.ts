import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// JWT секретный ключ - тот же, что в authController
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware для проверки авторизации
export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Получение токена из заголовка
    const authHeader = req.header("Authorization");
    if (!authHeader) {
        res.status(401).json({ message: "Нет токена авторизации" });
        return;
    }

    const token = authHeader.replace("Bearer ", "");

    try {
        // Верификация токена
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

        // Добавление id пользователя в request
        (req as any).user = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: "Недействительный токен" });
    }
};

// Middleware для проверки прав администратора
export const adminMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Предполагается, что authMiddleware уже выполнен и req.user содержит id пользователя
        const User = require("../models/User").default;
        const user = await User.findById((req as any).user);

        if (!user || !user.isAdmin) {
            res.status(403).json({ message: "Доступ запрещен" });
            return;
        }

        next();
    } catch (error) {
        console.error("Ошибка в adminMiddleware:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
};
