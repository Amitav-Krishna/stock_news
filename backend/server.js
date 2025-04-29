const express = require('express');
const cors = require('cors');
const stockRoutes = require('./routes/stock').default || require('./routes/stock');
const newsRoutes = require('./routes/news').default || require('./routes/news'); // Updated path
require('dotenv').config({ path: './.env' }); // Explicitly load the backend .env file
const app = express();

app.use(cors()); // Enable CORS for all routes
app.use(express.json());
app.use('/api/stock', stockRoutes); // Register the stock route
app.use('/api/news', newsRoutes); // Register the news route

app.listen(3300, () => console.log('Backend server running on port 3300')); // Use port 3300