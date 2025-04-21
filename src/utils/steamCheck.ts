import passport from "../config/passport";

export const checkSteamStrategy = () => {
    // Получаем список стратегий
    const strategies = (passport as any)._strategies || {};
    const strategyNames = Object.keys(strategies);

    console.log("Доступные стратегии passport:", strategyNames);

    if (strategyNames.includes("steam")) {
        console.log("Steam стратегия инициализирована успешно");
        return true;
    } else {
        console.error("Steam стратегия НЕ инициализирована");
        return false;
    }
};
