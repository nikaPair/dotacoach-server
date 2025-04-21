import express from "express";
import { check } from "express-validator";
import passport from "passport";
import {
    register,
    login,
    steamCallback,
    getCurrentUser,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// Маршрут для регистрации с валидацией полей
router.post(
    "/register",
    [
        check("email", "Пожалуйста, укажите корректный email").isEmail(),
        check(
            "password",
            "Пароль должен содержать минимум 6 символов"
        ).isLength({
            min: 6,
        }),
    ],
    register
);

// Маршрут для авторизации по email/password
router.post(
    "/login",
    [
        check("email", "Пожалуйста, укажите корректный email").isEmail(),
        check(
            "password",
            "Пароль должен содержать минимум 6 символов"
        ).isLength({
            min: 6,
        }),
    ],
    login
);

// Маршрут для авторизации через Steam
router.get("/steam", (req, res, next) => {
    console.log("Получен запрос на авторизацию через Steam");
    passport.authenticate("steam", { session: false })(req, res, next);
});

// Обработка callback от Steam
router.get(
    "/steam/callback",
    (req, res, next) => {
        console.log("Получен callback от Steam", req.query);
        passport.authenticate("steam", {
            session: false,
            failureRedirect: "/login",
        })(req, res, next);
    },
    steamCallback
);

// Маршрут для получения информации о текущем пользователе
router.get("/me", authMiddleware, getCurrentUser);

export default router;
