import axios from 'axios';

const STRATZ_API_URL = 'https://api.stratz.com/graphql';
const STRATZ_API_TOKEN = process.env.STRATZ_API_TOKEN;

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
  if (!STRATZ_API_TOKEN) {
    throw new Error('STRATZ API token is missing');
  }

  const { query, variables = {}, timeout = 10000 } = options;

  try {
    const { data } = await axios.post(
      STRATZ_API_URL,
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${STRATZ_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout
      }
    );

    if (data.errors) {
      throw new Error(JSON.stringify(data.errors));
    }

    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout while connecting to Stratz API');
      }
      
      if (error.response) {
        throw new Error(`Stratz API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
    }
    
    throw error;
  }
}; 