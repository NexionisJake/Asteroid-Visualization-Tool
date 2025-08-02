// Configuration file - In production, this should be handled by a backend server
export const CONFIG = {
    NASA_API_KEY: 'mKf1ClWGQWN9aLPobvr4WFyBAEh1crKFTfK6gcOO',
    NEO_URL: 'https://api.nasa.gov/neo/rest/v1/feed',
    // You can add more configuration options here
    MAX_ASTEROIDS: 100,
    DEFAULT_TIME_RANGE_DAYS: 7
};

// In a production environment, consider:
// 1. Using environment variables
// 2. Implementing a backend API proxy
// 3. Using a build system to inject secrets
