const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DB_NAME = process.env.MYSQL_DATABASE || 'arogya_sakhi_ai';
const DB_ENABLED = !!process.env.MYSQL_HOST && !!process.env.MYSQL_USER;

const config = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || '',
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

async function init() {
  if (!DB_ENABLED) {
    console.log('DB: MySQL config not found. Running in fallback JSON mode.');
    return;
  }

  try {
    const setupConnection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true
    });

    await setupConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    await setupConnection.end();

    pool = mysql.createPool(config);
    await createSchemas();

    console.log(`DB: Connected to MySQL database ${DB_NAME}`);
  } catch (error) {
    console.error('DB: MySQL initialization failed:', error.message);
    pool = null;
  }
}

async function createSchemas() {
  if (!pool) return;
  const create = `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(128) UNIQUE NOT NULL,
      password_hash VARCHAR(256) NOT NULL,
      name VARCHAR(256) NOT NULL,
      role VARCHAR(32) NOT NULL,
      facility VARCHAR(256),
      specialty VARCHAR(256),
      active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(256) NOT NULL,
      age INT,
      gender VARCHAR(32),
      phone VARCHAR(64),
      email VARCHAR(128),
      address TEXT,
      village VARCHAR(128),
      district VARCHAR(128),
      state VARCHAR(128),
      pincode VARCHAR(16),
      aadhar_last4 VARCHAR(16),
      health_id VARCHAR(64),
      blood_group VARCHAR(16),
      allergies TEXT,
      chronic_conditions TEXT,
      current_medications TEXT,
      family_history TEXT,
      emergency_contact JSON,
      insurance_provider VARCHAR(128),
      insurance_policy_number VARCHAR(128),
      case_ids TEXT,
      follow_ups TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_by VARCHAR(128)
    );

    CREATE TABLE IF NOT EXISTS cases (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64),
      patient_name VARCHAR(256),
      age INT,
      symptoms JSON,
      severity VARCHAR(64),
      duration INT,
      vitals JSON,
      current_medications JSON,
      allergies JSON,
      medical_history JSON,
      attachments JSON,
      ai JSON,
      image_triage JSON,
      status VARCHAR(64),
      audit JSON,
      doctor_review JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64),
      doctor_id VARCHAR(64),
      scheduled_at DATETIME,
      status VARCHAR(64),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64),
      doctor_id VARCHAR(64),
      medication TEXT,
      dosage TEXT,
      instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emergency_alerts (
      id VARCHAR(64) PRIMARY KEY,
      patient_id VARCHAR(64),
      case_id VARCHAR(64),
      alert_type VARCHAR(128),
      priority VARCHAR(64),
      location VARCHAR(256),
      metadata JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_predictions (
      id VARCHAR(64) PRIMARY KEY,
      case_id VARCHAR(64),
      prediction JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(64) PRIMARY KEY,
      case_id VARCHAR(64),
      patient_id VARCHAR(64),
      report_type VARCHAR(128),
      content JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64),
      action VARCHAR(128),
      target_id VARCHAR(64),
      metadata JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hospitals (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(256),
      address TEXT,
      city VARCHAR(128),
      state VARCHAR(128),
      phone VARCHAR(64),
      latitude DECIMAL(10,7),
      longitude DECIMAL(10,7),
      capacity INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS symptoms (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(256),
      category VARCHAR(128),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const conn = await pool.getConnection();
  try {
    await conn.query(create);
  } finally {
    conn.release();
  }
}

async function execute(query, params = []) {
  if (!pool) {
    throw new Error('MySQL is not configured or available.');
  }

  const [rows] = await pool.execute(query, params);
  return rows;
}

module.exports = {
  init,
  execute,
  isAvailable: () => !!pool,
  config,
};
