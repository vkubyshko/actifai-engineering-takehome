'use strict';

const express = require('express');
const seeder = require('./seed');
const { Pool } = require('pg');
const queryUtils = require('./timeseries-utils');
const db = require('./db');

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

const pool = new Pool(db.config);

async function start() {
  // Seed the database
  await seeder.seedDatabase();

  // App
  const app = express();

  // Health check
  app.get('/health', (req, res) => {
    res.send('Hello World');
  });

  app.get('/time-series', async (req, res) => {
    try {
      const { query, values } = queryUtils.formatQuery(req.query);
      const result = await pool.query(query, values)
      res.send(result.rows);
    } catch (error) {
      errorHandler(error, res)
    }
  })

  app.listen(PORT, HOST);
  console.log(`Server is running on http://${HOST}:${PORT}`);
}

function errorHandler (err, res) {
  return res.status(400).send({message: err.message});
}

start();
