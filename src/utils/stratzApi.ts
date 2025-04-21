import axios from "axios";

const STRATZ_API_URL = "https://api.stratz.com/graphql";
const STRATZ_API_TOKEN =
  process.env.STRATZ_API_TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJTdWJqZWN0IjoiMDg1NWMyYWYtMTJhNy00ZjlkLThkMDUtYjVmNWQwMDlkOTIxIiwiU3RlYW1JZCI6IjgzOTQxNTE2NSIsIm5iZiI6MTc0NTI2NzE3NiwiZXhwIjoxNzc2ODAzMTc2LCJpYXQiOjE3NDUyNjcxNzYsImlzcyI6Imh0dHBzOi8vYXBpLnN0cmF0ei5jb20ifQ.1vKtQZATIkajpHOOBYQ6hHtmxDtA1MC26qvB6gp7bBo";

// Проверка наличия токена при загрузке модуля
console.log(`STRATZ API Token configured: ${!!STRATZ_API_TOKEN}`);

interface StratzQueryOptions {
  query: string;
  variables?: Record<string, any>;
  timeout?: number;
}

/**
 * Makes a request to the STRATZ GraphQL API
 * @param options Query options and variables
 * @returns API response data
 * @throws Error if API token is missing or request fails
 */
export const queryStratzApi = async (options: StratzQueryOptions) => {
  console.log(`Running STRATZ API query with token available: ${!!STRATZ_API_TOKEN}`);
  
  if (!STRATZ_API_TOKEN) {
    console.error("STRATZ API token is missing even with fallback");
    throw new Error("STRATZ API token is missing");
  }

  const { query, variables = {}, timeout = 10000 } = options;

  try {
    console.log(`Sending request to STRATZ API: ${STRATZ_API_URL}`);
    console.log(`Request variables:`, variables);
    
    const { data } = await axios.post(
      STRATZ_API_URL,
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${STRATZ_API_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Origin": "https://stratz.com",
          "Referer": "https://stratz.com/",
          "Sec-Ch-Ua": "\"Not_A Brand\";v=\"8\", \"Chromium\";v=\"120\"",
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": "\"Windows\"",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-site",
          "Dnt": "1",
          "Cache-Control": "no-cache"
        },
        timeout,
      }
    );

    console.log(`STRATZ API response received`);
    
    if (data.errors) {
      console.error(`STRATZ API returned errors:`, data.errors);
      throw new Error(JSON.stringify(data.errors));
    }

    return data.data;
  } catch (error) {
    console.error(`STRATZ API request failed:`, error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        throw new Error("Timeout while connecting to Stratz API");
      }

      if (error.response) {
        throw new Error(
          `Stratz API error: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        );
      }
    }

    throw error;
  }
};
