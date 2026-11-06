Team:

Karanam Srujana

KP Preetika Setty

# Wanderly: Travel & Tour Management System
DBMS Experiential Learning, Level 3 project (PES University).
Stack: **Next.js 14** (UI + API route handlers) · **MySQL 8** (relational core) · **MongoDB** (reviews, itineraries, activity logs) · JWT auth (httpOnly cookie) · Git/GitHub.

## What it does
* Customers browse tours, search (MySQL FULLTEXT) and filter, book seats, pay, cancel (with refund) and review tours.
* Admins manage tours, destinations, see all bookings, mark trips completed and view analytics dashboards.
* Booking is one atomic transaction (stored procedure + row lock); triggers keep seats, status, refunds and the audit log consistent.

## Prerequisites
Node.js 18+, MySQL 8.0+, MongoDB 6+ (local, or a free MongoDB Atlas URI), Git.

## Setup
```bash
# 1. install dependencies
npm install

# 2. create the MySQL database (run from the project root; enter your MySQL password when asked)
mysql -u root -p < database/01_schema.sql
mysql -u root -p travel_tour_db < database/02_programmability.sql
mysql -u root -p travel_tour_db < database/03_seed.sql

# 3. configure environment variables
cp .env.example .env.local        # Windows: copy .env.example .env.local
#    edit .env.local: MySQL password, MongoDB URI, a long random JWT_SECRET

# 4. seed users (bcrypt-hashed), sample bookings, MongoDB data and indexes
npm run seed

# 5. run
npm run dev                       # http://localhost:3000
```
Demo accounts: `admin@wanderly.in / Admin@123` · `priya@example.com / Customer@123`

On Windows `cmd`, if `mysql` is not recognised, add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to PATH or use the full path.

## Project layout
```
database/    01_schema.sql, 02_programmability.sql (views, triggers, procedures, function), 03_seed.sql, 04_important_queries.sql
mongodb/     schema_and_queries.js (collections, validator, indexes, aggregations; run with mongosh)
scripts/     seed.js
lib/         db.js (MySQL pool) · mongo.js · auth.js (JWT + role guard) · client.js
app/api/     route handlers (auth, tours, bookings, reviews, destinations, guides, admin/stats)
app/         pages: home, tour detail, bookings, login, register, admin
docs/        PROJECT_DOCUMENTATION.md, ER diagram (png/svg/dot), TEST_CASES.md
```

## Git workflow (individual contributions)
Each member works on own branches and commits under their own name:
```bash
git init && git add . && git commit -m "Initial project structure"
git remote add origin <your-repo-url> && git push -u origin main
```
Suggested split is in `docs/PROJECT_DOCUMENTATION.md` section 13.
