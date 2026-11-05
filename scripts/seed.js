// Seeds: bcrypt-hashed users (MySQL) + itineraries/reviews/indexes (MongoDB)
// Usage: npm run seed      (run AFTER the three SQL files)
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');

(async () => {
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST, port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER, password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DATABASE,
  });
  const users = [
    ['Admin User', 'admin@wanderly.in', 'Admin@123', '9000000001', 'admin'],
    ['Priya Sharma', 'priya@example.com', 'Customer@123', '9000000002', 'customer'],
    ['Arjun Rao', 'arjun@example.com', 'Customer@123', '9000000003', 'customer'],
  ];
  for (const [name, email, pw, phone, role] of users) {
    await db.execute(
      'INSERT IGNORE INTO users (name,email,password_hash,phone,role) VALUES (?,?,?,?,?)',
      [name, email, await bcrypt.hash(pw, 10), phone, role]);
  }
  // sample bookings through the stored procedure (exercises transaction + triggers)
  const [[p]] = await db.query("SELECT user_id FROM users WHERE email='priya@example.com'");
  const [[a]] = await db.query("SELECT user_id FROM users WHERE email='arjun@example.com'");
  const [[{ n }]] = await db.query('SELECT COUNT(*) n FROM bookings');
  if (n === 0) {
    await db.query('CALL sp_book_tour(?,?,?,?,@id)', [p.user_id, 1, 2, 'upi']);
    await db.query('CALL sp_book_tour(?,?,?,?,@id)', [p.user_id, 4, 1, 'card']);
    await db.query('CALL sp_book_tour(?,?,?,?,@id)', [a.user_id, 1, 3, 'card']);
    await db.query('CALL sp_book_tour(?,?,?,?,@id)', [a.user_id, 2, 2, 'netbanking']);
  }
  await db.end();

  const mongo = await MongoClient.connect(process.env.MONGODB_URI);
  const m = mongo.db(process.env.MONGODB_DB);
  await m.collection('itineraries').deleteMany({});
  await m.collection('itineraries').insertMany([
    { tourId: 1, highlights: ['Tea estate walk', 'Attukal waterfalls', 'Spice plantation'],
      days: [
        { day: 1, title: 'Arrival & Tea Museum', activities: ['Check-in', 'Tea museum visit'], meals: ['Dinner'] },
        { day: 2, title: 'Estate Trails', activities: ['Guided tea estate walk', 'Mattupetty dam'], meals: ['Breakfast', 'Lunch', 'Dinner'] },
        { day: 3, title: 'Waterfalls', activities: ['Attukal waterfalls', 'Spice garden'], meals: ['Breakfast', 'Dinner'] },
        { day: 4, title: 'Departure', activities: ['Sunrise viewpoint'], meals: ['Breakfast'] } ],
      inclusions: ['Stay', 'Breakfast & dinner', 'Local transport', 'Guide'], exclusions: ['Flights', 'Personal expenses'] },
    { tourId: 2, highlights: ['Amer Fort', 'Block printing', 'Hawa Mahal'],
      days: [
        { day: 1, title: 'Amer Fort & Jal Mahal', activities: ['Amer Fort', 'Jal Mahal photo stop'], meals: ['Lunch', 'Dinner'] },
        { day: 2, title: 'City Palace & Bazaars', activities: ['City Palace', 'Jantar Mantar', 'Bazaar walk'], meals: ['Breakfast', 'Dinner'] },
        { day: 3, title: 'Block-printing workshop', activities: ['Sanganer workshop'], meals: ['Breakfast'] } ],
      inclusions: ['Heritage stay', 'Entry tickets', 'Guide'], exclusions: ['Flights', 'Shopping'] },
    { tourId: 3, highlights: ['Khardung La', 'Pangong Lake', 'Hemis monastery'],
      days: [
        { day: 1, title: 'Arrive Leh & acclimatise', activities: ['Rest', 'Short walk'], meals: ['Dinner'] },
        { day: 2, title: 'Leh sightseeing', activities: ['Shanti Stupa', 'Leh Palace'], meals: ['Breakfast', 'Dinner'] } ],
      inclusions: ['Camps & hotels', 'All meals', 'Permits', 'Oxygen support'], exclusions: ['Flights'] },
  ]);
  await m.collection('reviews').deleteMany({});
  await m.collection('reviews').insertMany([
    { tourId: 1, userId: p.user_id, userName: 'Priya Sharma', rating: 5, title: 'Magical mornings', comment: 'The guide was friendly and knew every trail. Tea estate sunrise was unforgettable.', tags: ['guide', 'scenery'], createdAt: new Date() },
    { tourId: 1, userId: a.user_id, userName: 'Arjun Rao', rating: 4, title: 'Great value', comment: 'Well organised trip, hotels were clean and the waterfalls were beautiful.', tags: ['value', 'hotels'], createdAt: new Date() },
    { tourId: 2, userId: a.user_id, userName: 'Arjun Rao', rating: 5, title: 'Heritage at its best', comment: 'The block-printing workshop was the highlight, guide was very friendly.', tags: ['guide', 'culture'], createdAt: new Date() },
  ]);
  await m.collection('reviews').createIndex({ tourId: 1, createdAt: -1 });
  await m.collection('reviews').createIndex({ tourId: 1, userId: 1 }, { unique: true });
  await m.collection('reviews').createIndex({ comment: 'text', title: 'text' });
  await m.collection('itineraries').createIndex({ tourId: 1 }, { unique: true });
  await m.collection('activity_logs').createIndex({ ts: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
  await mongo.close();
  console.log('Seed complete.\nAdmin: admin@wanderly.in / Admin@123\nCustomer: priya@example.com / Customer@123');
})().catch((e) => { console.error(e); process.exit(1); });
