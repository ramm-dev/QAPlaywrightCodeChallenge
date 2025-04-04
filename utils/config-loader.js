const dotenv = require('dotenv');
const path = require('path');

// Load environment variables based on TEST_ENV
const env = process.env.TEST_ENV || 'prod';
const envPath = path.resolve(process.cwd(), `env/.env.${env.toLowerCase()}`);

// Load the appropriate .env file
dotenv.config({ path: envPath });

// Export configuration object
module.exports = {
  baseUrl: process.env.BASE_URL,
  apiBaseUrl: process.env.API_BASE_URL,
  credentials: {
    username: process.env.DEFAULT_USERNAME,
    password: process.env.DEFAULT_PASSWORD,
  },
  timeouts: {
    navigation: parseInt(process.env.NAVIGATION_TIMEOUT),
    element: parseInt(process.env.ELEMENT_TIMEOUT),
  }
}; 