const express = require('express');
const morgan = require('morgan');
const hpp = require('hpp');
const path = require('path');
const cors = require('cors');
const compression = require('compression');

const carRoutes = require('./routes/car-routes');
const userRoutes = require('./routes/user-routes');
const errController = require('./utils/err-controller');

// Start using express.js
const app = express();

// Development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Serve static files
app.use(express.static(path.join(`${__dirname}`, 'public')));

// Setting CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/*
 * The middleware below is for preventing parameter polution;
 * So if multiple parameters are placed in the url query, only
 * the last one is considered. White list is excluded.
 */
app.use(
  hpp({
    whitelist: [
      'manufacturer',
      'model',
      'releaseYear',
      'numOfRatings',
      'ratingsAverage',
    ],
  })
);

// Compressin the response
app.use(compression());

// Body parser
app.use(express.json());

// Routes
app.use('/api/v1/cars', carRoutes);
app.use('/api/v1/users', userRoutes);

// Undefined routes
app.use('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: 'route does not exist',
  });

  next();
});

// Global error controller
app.use(errController);

module.exports = app;
