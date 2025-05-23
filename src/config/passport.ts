import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as SteamStrategy } from "passport-steam";
import User from "../models/User";

// JWT секретный ключ
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Steam API ключ (жестко задан)
const STEAM_API_KEY = "963EDAC318C7FE05B0959874FADE561D";

// URL для обратного вызова после авторизации в Steam
const STEAM_CALLBACK_URL =
    process.env.STEAM_CALLBACK_URL ||
    "http://localhost:5000/api/auth/steam/callback";

// Опции для JWT стратегии
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
};

// Инициализация JWT стратегии
passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            // Находим пользователя по ID из токена
            const user = await User.findById(payload.id);
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

// Инициализация Steam стратегии
console.log(
    "Инициализация Steam стратегии с ключом API:",
    STEAM_API_KEY.substring(0, 5) + "..."
);
console.log("STEAM_CALLBACK_URL:", STEAM_CALLBACK_URL);
console.log(
    "STEAM_REALM:",
    process.env.STEAM_REALM || "http://localhost:5000/"
);

try {
    passport.use(
        new SteamStrategy(
            {
                returnURL: STEAM_CALLBACK_URL,
                realm: process.env.STEAM_REALM || "http://localhost:5000/",
                apiKey: STEAM_API_KEY,
            },
            async (identifier, profile, done) => {
                console.log("Steam авторизация успешна:", profile.id);
                try {
                    // Извлекаем steamId из профиля
                    const steamId = profile.id;

                    // Формируем полный URL аватара
                    let avatarUrl = profile._json?.avatar;

                    // Проверяем, содержит ли URL полный путь или нет
                    if (avatarUrl && !avatarUrl.startsWith("http")) {
                        avatarUrl = `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/${avatarUrl}`;
                    }

                    // Ищем пользователя по steamId
                    let user = await User.findOne({ steamId });

                    if (!user) {
                        // Если пользователь не найден, создаем нового
                        user = new User({
                            steamId,
                            steamDisplayName: profile.displayName,
                            steamAvatar: avatarUrl,
                            steamProfile: profile._json?.profileurl,
                            lastLogin: new Date(),
                        });
                        await user.save();
                    } else {
                        // Обновляем информацию о пользователе
                        user.steamDisplayName = profile.displayName;
                        user.steamAvatar = avatarUrl;
                        user.steamProfile = profile._json?.profileurl;
                        user.lastLogin = new Date();
                        await user.save();
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );
} catch (error) {
    console.error("Ошибка при инициализации Steam стратегии:", error);
}

// Сериализация пользователя для сессии
passport.serializeUser((user: any, done) => {
    console.log("Сериализация пользователя:", user.id);
    // Пользователь Steam имеет steamId, используем его вместо _id MongoDB
    if (user.steamId) {
        done(null, { id: user.id, steamId: user.steamId });
    } else {
        done(null, { id: user.id });
    }
});

// Десериализация пользователя из сессии
passport.deserializeUser(async (data: any, done) => {
    try {
        console.log("Десериализация пользователя:", data);
        // Если есть steamId, ищем пользователя по нему
        let user;
        if (data.steamId) {
            user = await User.findOne({ steamId: data.steamId });
        } else {
            user = await User.findById(data.id);
        }
        done(null, user);
    } catch (error) {
        console.error("Ошибка десериализации:", error);
        done(error);
    }
});

export default passport;
