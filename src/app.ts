import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./routes";
import passport from "passport";
import "./config/passport";

// Инициализация Express
const app = express();

// CORS middleware для разрешения кросс-доменных запросов
app.use(
    cors({
        origin: true, // Разрешить запросы с любого происхождения
        credentials: true, // Разрешить передачу учетных данных (cookies, authorization headers и т.д.)
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        exposedHeaders: ["Set-Cookie", "Authorization"],
    })
);

app.use(express.json());

// ... existing code ...

// ... existing code ...
