import axios from "axios";


const OPENDOTA_API_URL = "https://api.opendota.com/api";

// Проверка наличия токена при загрузке модуля
console.log(`OpenDota API URL configured: ${OPENDOTA_API_URL}`);


interface OpenDotaQueryOptions {
  endpoint: string; // REST API endpoint (e.g., "/players/{account_id}")
  params?: Record<string, any>; // Query parameters
  timeout?: number;
}

/**
 * Makes a request to the STRATZ GraphQL API
 * @param options Query options and variables
 * @returns API response data
 * @throws Error if API token is missing or request fails
 */

/**
 * Makes a request to the OpenDota API
 * @param options Query options and parameters
 * @returns API response data
 * @throws Error if request fails
 */
export const queryOpenDotaApi = async (options: OpenDotaQueryOptions) => {
  const { endpoint, params = {}, timeout = 10000 } = options;

  try {
    console.log(
      `Sending request to OpenDota API: ${OPENDOTA_API_URL}${endpoint}`
    );
    console.log(`Request parameters:`, params);

    const { data } = await axios.get(`${OPENDOTA_API_URL}${endpoint}`, {
      params,
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
      timeout,
    });

    console.log(`OpenDota API response received`);
    return data;
  } catch (error) {
    console.error(`OpenDota API request failed:`, error);

    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new Error("Timeout while connecting to OpenDota API");
      }

      if (error.response) {
        throw new Error(
          `OpenDota API error: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        );
      }
    }

    throw error;
  }
};
