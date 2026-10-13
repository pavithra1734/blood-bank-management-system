const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'blood_bank',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10
});

// Home route
app.get('/', (req, res) => {
  res.send('LifeDrop Blood Bank Backend is running!');
});

// Test backend and MySQL connection
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      server: 'running',
      database: 'connected'
    });
  } catch (error) {
    console.error('Database error:', error.message);

    res.status(500).json({
      server: 'running',
      database: 'disconnected'
    });
  }
});

// Test database connection separately
app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS connected');

    res.json({
      success: true,
      message: 'MySQL connected successfully!',
      result: rows[0]
    });
  } catch (error) {
    console.error('MySQL error:', error.message);

    res.status(500).json({
      success: false,
      message: 'MySQL connection failed',
      error: error.message
    });
  }
});

// Get all donors
app.get('/api/donors', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM donors ORDER BY id DESC'
    );

    res.json(rows);
  } catch (error) {
    console.error('Fetch donors error:', error.message);

    res.status(500).json({
      error: 'Could not fetch donors'
    });
  }
});

// Register a donor
app.post('/api/donors', async (req, res) => {
  try {
    const { name, age, blood_group, phone, city } = req.body;

    if (!name || !blood_group) {
      return res.status(400).json({
        error: 'Name and blood group are required'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO donors
       (name, age, blood_group, phone, city)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        age || null,
        blood_group,
        phone || null,
        city || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Donor registered successfully!',
      id: result.insertId
    });
  } catch (error) {
    console.error('Register donor error:', error.message);

    res.status(500).json({
      error: 'Could not register donor. Check the database table.'
    });
  }
});

// Get blood inventory
app.get('/api/inventory', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM blood_inventory ORDER BY blood_group'
    );

    res.json(rows);
  } catch (error) {
    console.error('Inventory error:', error.message);

    res.status(500).json({
      error: 'Could not fetch blood inventory'
    });
  }
});

// Get blood requests
app.get('/api/requests', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM blood_requests ORDER BY id DESC'
    );

    res.json(rows);
  } catch (error) {
    console.error('Fetch requests error:', error.message);

    res.status(500).json({
      error: 'Could not fetch blood requests'
    });
  }
});

// Submit a blood request
app.post('/api/requests', async (req, res) => {
  try {
    const { patient_name, blood_group, units, hospital } = req.body;

    if (
      !patient_name ||
      !blood_group ||
      !Number.isInteger(units) ||
      units < 1
    ) {
      return res.status(400).json({
        error: 'Enter patient name, blood group and valid units'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO blood_requests
       (patient_name, blood_group, units, hospital)
       VALUES (?, ?, ?, ?)`,
      [
        patient_name,
        blood_group,
        units,
        hospital || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully!',
      id: result.insertId
    });
  } catch (error) {
    console.error('Submit request error:', error.message);

    res.status(500).json({
      error: 'Could not submit blood request'
    });
  }
});

// Start the backend server
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});