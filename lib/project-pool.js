
const urls = require('../lib/urls');
const db = urls.projectdb;
const { Pool } = require('pg');
const pool = new Pool({connectionString: db});

module.exports = pool;
