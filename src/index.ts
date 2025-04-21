import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import analyticsRoutes from "./routes/analitics";
import authRoutes from "./routes/auth";
import passport from "./config/passport";
import session from "express-session";
import { checkSteamStrategy } from "./utils/steamCheck";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Логирование запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Настройка CORS
app.use(cors());
app.use(express.json());

// Настройка сессий для Passport
app.use(
    session({
        secret: process.env.SESSION_SECRET || "your-session-secret",
        resave: false,
        saveUninitialized: false,
    })
);

// Инициализация Passport
console.log("Инициализация Passport...");
app.use(passport.initialize());
app.use(passport.session());

// Проверка Steam стратегии
checkSteamStrategy();

// Подключение к MongoDB
const uri = process.env.MONGO_URI || "";
mongoose
    .connect(uri)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

// Тестовый маршрут
app.get("/api/test", (req, res) => {
    console.log("Accessing test route");
    res.json({ message: "Test API is working" });
});

// Маршруты для аналитики
app.use("/api/analytics", analyticsRoutes);

// Маршруты для авторизации
app.use("/api/auth", authRoutes);

// Глобальная обработка ошибок
app.use(
    (
        err: Error,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        console.error("Global error handler triggered:");
        console.error(err);

        // Отправляем информативный ответ об ошибке
        res.status(500).json({
            error: "Something went wrong!",
            message: err.message,
            stack:
                process.env.NODE_ENV === "production" ? undefined : err.stack,
        });
    }
);

// Обработка 404
app.use((req, res) => {
    console.log(`Route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
