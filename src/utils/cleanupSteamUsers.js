/**
 * Скрипт для очистки дублирующихся записей пользователей Steam в базе данных
 *
 * Для запуска:
 * 1. Убедитесь, что сервер с MongoDB доступен
 * 2. Запустите: node src/utils/cleanupSteamUsers.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Загрузка переменных окружения
dotenv.config();

// Модель пользователя
const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    steamId: String,
    steamDisplayName: String,
    steamAvatar: String,
    steamProfile: String,
    isAdmin: Boolean,
    createdAt: Date,
    lastLogin: Date,
});

const User = mongoose.model("User", UserSchema);

// Подключение к MongoDB
const MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost:27017/dotacoach";

mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB подключена"))
    .catch((err) => {
        console.error("Ошибка подключения к MongoDB:", err);
        process.exit(1);
    });

async function cleanupSteamUsers() {
    try {
        console.log(
            "Начинаем поиск неправильных записей пользователей Steam..."
        );

        // Получаем всех пользователей
        const allUsers = await User.find();
        console.log(`Всего найдено ${allUsers.length} записей пользователей`);

        // Фильтруем пользователей, чей steamId соответствует MongoDB ID другого пользователя
        const suspiciousUsers = allUsers.filter((user) => {
            if (!user.steamId) return false;

            // Проверяем, совпадает ли steamId с форматом MongoDB ID
            return /^[0-9a-fA-F]{24}$/.test(user.steamId);
        });

        console.log(`Найдено ${suspiciousUsers.length} подозрительных записей`);

        // Выводим список подозрительных пользователей
        suspiciousUsers.forEach((user) => {
            console.log(`ID: ${user._id}, steamId: ${user.steamId}`);
        });

        // Спрашиваем подтверждение перед удалением
        console.log("\nВы хотите удалить эти записи? (y/n)");

        process.stdin.on("data", async (data) => {
            const input = data.toString().trim().toLowerCase();

            if (input === "y") {
                // Удаляем подозрительные записи
                const deleteResult = await Promise.all(
                    suspiciousUsers.map((user) =>
                        User.findByIdAndDelete(user._id)
                    )
                );

                console.log(
                    `Удалено ${deleteResult.filter(Boolean).length} записей`
                );
                console.log("Очистка завершена!");
            } else {
                console.log("Операция отменена. Ничего не удалено.");
            }

            // Закрываем соединение с MongoDB
            await mongoose.connection.close();
            process.exit(0);
        });
    } catch (error) {
        console.error("Ошибка при очистке базы данных:", error);
        process.exit(1);
    }
}

// Запуск очистки
cleanupSteamUsers();
