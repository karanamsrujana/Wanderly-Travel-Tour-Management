// MongoDB design + sample queries (run in mongosh:  mongosh < mongodb/schema_and_queries.js)
use('travel_tour_nosql');

// ---------- Collections ----------
// itineraries : one document per tour (nested day-by-day plan; variable structure => document model)
//   { tourId:Number, highlights:[String], days:[{day,title,activities:[String],meals:[String]}], inclusions:[String], exclusions:[String] }
// reviews     : { tourId, userId, userName, rating(1-5), title, comment, tags:[String], createdAt }
// activity_logs : { userId, action:'view_tour'|'search', tourId?, query?, ts }

db.createCollection('reviews', {
  validator: { $jsonSchema: {
    bsonType: 'object', required: ['tourId','userId','rating','comment','createdAt'],
    properties: {
      tourId: { bsonType: ['int','long','double'] }, userId: { bsonType: ['int','long','double'] },
      rating: { bsonType: ['int','long','double'], minimum: 1, maximum: 5 },
      comment: { bsonType: 'string', minLength: 5, maxLength: 1000 } } } }
});

// ---------- Indexes ----------
db.reviews.createIndex({ tourId: 1, createdAt: -1 });
db.reviews.createIndex({ tourId: 1, userId: 1 }, { unique: true });   // one review per user per tour
db.reviews.createIndex({ comment: 'text', title: 'text' });            // text search
db.itineraries.createIndex({ tourId: 1 }, { unique: true });
db.activity_logs.createIndex({ ts: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // TTL: keep 90 days

// ---------- Aggregation 1: average rating + count per tour ----------
db.reviews.aggregate([
  { $group: { _id: '$tourId', avgRating: { $avg: '$rating' }, reviews: { $sum: 1 } } },
  { $sort: { avgRating: -1 } }
]);

// ---------- Aggregation 2: rating distribution for one tour ----------
db.reviews.aggregate([
  { $match: { tourId: 1 } },
  { $group: { _id: '$rating', count: { $sum: 1 } } },
  { $sort: { _id: -1 } }
]);

// ---------- Aggregation 3: most-used review tags ----------
db.reviews.aggregate([
  { $unwind: '$tags' }, { $group: { _id: '$tags', n: { $sum: 1 } } },
  { $sort: { n: -1 } }, { $limit: 5 }
]);

// ---------- Aggregation 4: most viewed tours ----------
db.activity_logs.aggregate([
  { $match: { action: 'view_tour' } },
  { $group: { _id: '$tourId', views: { $sum: 1 } } },
  { $sort: { views: -1 } }, { $limit: 5 }
]);

// ---------- Text search ----------
db.reviews.find({ $text: { $search: 'guide friendly' } });
