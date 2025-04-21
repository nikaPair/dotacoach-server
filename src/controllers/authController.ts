import { Request, Response, NextFunction } from "express";
import { RequestHandler } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

// JWT секретный ключ - необходимо добавить в .env
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Генерация JWT токена
const generateToken = (userId: string) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
};

// Регистрация через email/пароль
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Проверка валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email, password } = req.body;

        // Проверка, существует ли уже пользователь
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "Пользователь уже существует" });
            return;
        }

        // Хеширование пароля
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Создание нового пользователя
        const user = new User({
            email,
            password: hashedPassword,
        });

        await user.save();

        // Генерация токена
        const token = generateToken(user._id.toString());

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                steamAvatar: user.steamAvatar,
            },
        });
    } catch (error) {
        console.error("Ошибка при регистрации:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
};

// Авторизация через email/пароль
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Проверка валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const { email, password } = req.body;

        // Поиск пользователя
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: "Неверные учетные данные" });
            return;
        }

        // Проверка пароля
        const isMatch = await bcrypt.compare(password, user.password || "");
        if (!isMatch) {
            res.status(400).json({ message: "Неверные учетные данные" });
            return;
        }

        // Обновление времени последнего входа
        user.lastLogin = new Date();
        await user.save();

        // Генерация токена
        const token = generateToken(user._id.toString());

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Ошибка при авторизации:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
};

// Маршрут для обработки авторизации через Steam
export const steamCallback = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        // Предполагается, что с помощью passport-steam была выполнена аутентификация
        // и в req.user есть данные пользователя Steam
        if (!req.user) {
            res.status(400).json({ message: "Ошибка аутентификации Steam" });
            return;
        }

        const steamUser = req.user as any;

        // Ищем или создаем пользователя с steamId
        let user = await User.findOne({ steamId: steamUser.id });

        if (!user) {
            // Если пользователь не найден, создаем нового
            user = new User({
                steamId: steamUser.id,
                steamDisplayName: steamUser.displayName,
                steamAvatar: steamUser._json?.avatar,
                steamProfile: steamUser._json?.profileurl,
            });
        } else {
            // Обновляем информацию о пользователе, если он уже существует
            user.steamDisplayName = steamUser.displayName;
            user.steamAvatar = steamUser._json?.avatar;
            user.steamProfile = steamUser._json?.profileurl;
        }

        // Обновляем время последнего входа
        user.lastLogin = new Date();
        await user.save();

        // Генерация токена
        const token = generateToken(user._id.toString());

        // Создаем объект с данными авторизации
        const authData = {
            token,
            user: {
                id: user._id,
                steamId: user.steamId,
                steamDisplayName: user.steamDisplayName,
                steamAvatar: user.steamAvatar,
            },
        };

        // Вместо отправки JSON отправляем HTML-страницу, которая закроет окно и передаст данные родительскому окну
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Авторизация через Steam</title>
            <script>
                // Данные авторизации
                const authData = ${JSON.stringify(authData)};
                
                // Функция выполняется при загрузке страницы
                window.onload = function() {
                    // Передаем данные родительскому окну и закрываем текущее
                    if (window.opener) {
                        window.opener.postMessage({ type: 'STEAM_AUTH_SUCCESS', data: authData }, '*');
                        setTimeout(function() { window.close(); }, 1000);
                    }
                };
            </script>
        </head>
        <body>
            <h3>Авторизация успешна</h3>
            <p>Окно будет закрыто автоматически...</p>
        </body>
        </html>
        `;

        res.set("Content-Type", "text/html");
        res.send(html);
    } catch (error) {
        console.error("Ошибка при авторизации через Steam:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
};

// Получение текущего пользователя по токену
export const getCurrentUser = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        // Предполагается, что req.user установлен middleware аутентификации
        const user = await User.findById((req as any).user);

        if (!user) {
            res.status(404).json({ message: "Пользователь не найден" });
            return;
        }

        // Возвращаем информацию о пользователе без пароля
        res.json({
            user: {
                id: user._id,
                email: user.email,
                steamId: user.steamId,
                steamDisplayName: user.steamDisplayName,
                steamAvatar: user.steamAvatar,
                isAdmin: user.isAdmin,
            },
        });
    } catch (error) {
        console.error("Ошибка при получении пользователя:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
};
