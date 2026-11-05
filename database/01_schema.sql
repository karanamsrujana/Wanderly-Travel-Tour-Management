-- =====================================================================
-- Wanderly - Travel & Tour Management  |  MySQL 8.0+  |  DDL
-- Run:  mysql -u root -p < database/01_schema.sql
-- =====================================================================
DROP DATABASE IF EXISTS travel_tour_db;
CREATE DATABASE travel_tour_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travel_tour_db;

-- ---------- USERS (authentication + 2 roles) ----------
CREATE TABLE users (
  user_id        INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  phone          VARCHAR(15),
  role           ENUM('admin','customer') NOT NULL DEFAULT 'customer',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_user_email CHECK (email LIKE '%_@_%._%'),
  CONSTRAINT chk_user_phone CHECK (phone IS NULL OR phone REGEXP '^[0-9+ -]{7,15}$')
) ENGINE=InnoDB;

-- ---------- DESTINATIONS ----------
CREATE TABLE destinations (
  destination_id INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  country        VARCHAR(80)  NOT NULL,
  region         VARCHAR(80),
  description    TEXT,
  best_season    VARCHAR(60),
  UNIQUE KEY uq_dest (name, country)
) ENGINE=InnoDB;

-- ---------- GUIDES ----------
CREATE TABLE guides (
  guide_id         INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(150) NOT NULL UNIQUE,
  phone            VARCHAR(15),
  languages        VARCHAR(150) NOT NULL DEFAULT 'English',
  experience_years TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT chk_guide_exp CHECK (experience_years <= 50)
) ENGINE=InnoDB;

-- ---------- HOTELS ----------
CREATE TABLE hotels (
  hotel_id        INT AUTO_INCREMENT PRIMARY KEY,
  destination_id  INT NOT NULL,
  name            VARCHAR(120) NOT NULL,
  star_rating     TINYINT NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  CONSTRAINT chk_star   CHECK (star_rating BETWEEN 1 AND 5),
  CONSTRAINT chk_hprice CHECK (price_per_night >= 0),
  CONSTRAINT fk_hotel_dest FOREIGN KEY (destination_id)
      REFERENCES destinations(destination_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- TOURS ----------
CREATE TABLE tours (
  tour_id         INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(150) NOT NULL,
  description     TEXT,
  destination_id  INT NOT NULL,
  guide_id        INT NULL,
  duration_days   SMALLINT NOT NULL,
  price           DECIMAL(10,2) NOT NULL,
  max_seats       SMALLINT NOT NULL,
  available_seats SMALLINT NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  difficulty      ENUM('easy','moderate','hard') NOT NULL DEFAULT 'easy',
  status          ENUM('open','closed','cancelled') NOT NULL DEFAULT 'open',
  CONSTRAINT chk_duration CHECK (duration_days > 0),
  CONSTRAINT chk_price    CHECK (price >= 0),
  CONSTRAINT chk_seats    CHECK (max_seats > 0 AND available_seats >= 0 AND available_seats <= max_seats),
  CONSTRAINT chk_dates    CHECK (end_date >= start_date),
  CONSTRAINT fk_tour_dest  FOREIGN KEY (destination_id) REFERENCES destinations(destination_id) ON DELETE RESTRICT,
  CONSTRAINT fk_tour_guide FOREIGN KEY (guide_id) REFERENCES guides(guide_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- TOUR_HOTELS (M:N between tours and hotels) ----------
CREATE TABLE tour_hotels (
  tour_id  INT NOT NULL,
  hotel_id INT NOT NULL,
  nights   TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (tour_id, hotel_id),
  CONSTRAINT chk_nights CHECK (nights > 0),
  CONSTRAINT fk_th_tour  FOREIGN KEY (tour_id)  REFERENCES tours(tour_id)  ON DELETE CASCADE,
  CONSTRAINT fk_th_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(hotel_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- BOOKINGS ----------
CREATE TABLE bookings (
  booking_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  tour_id       INT NOT NULL,
  seats         SMALLINT NOT NULL,
  total_amount  DECIMAL(12,2) NOT NULL,
  status        ENUM('confirmed','cancelled','completed') NOT NULL DEFAULT 'confirmed',
  booking_date  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_bseats CHECK (seats BETWEEN 1 AND 10),
  CONSTRAINT chk_btotal CHECK (total_amount >= 0),
  CONSTRAINT fk_book_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_book_tour FOREIGN KEY (tour_id) REFERENCES tours(tour_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------- PAYMENTS (1:1 with a booking) ----------
CREATE TABLE payments (
  payment_id  INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT NOT NULL UNIQUE,
  amount      DECIMAL(12,2) NOT NULL,
  method      ENUM('card','upi','netbanking','cash') NOT NULL,
  status      ENUM('paid','refunded','pending') NOT NULL DEFAULT 'paid',
  paid_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_pamount CHECK (amount >= 0),
  CONSTRAINT fk_pay_book FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- AUDIT LOG (filled by triggers) ----------
CREATE TABLE audit_log (
  log_id      INT AUTO_INCREMENT PRIMARY KEY,
  table_name  VARCHAR(50) NOT NULL,
  action      VARCHAR(30) NOT NULL,
  record_id   INT NOT NULL,
  details     VARCHAR(255),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- INDEXES ----------
CREATE INDEX idx_tours_dest_start ON tours (destination_id, start_date);
CREATE INDEX idx_tours_price      ON tours (price);
CREATE INDEX idx_bookings_user    ON bookings (user_id, booking_date);
CREATE INDEX idx_bookings_tour    ON bookings (tour_id, status);
CREATE FULLTEXT INDEX ft_tours_search ON tours (title, description);
CREATE FULLTEXT INDEX ft_dest_search  ON destinations (name, description);

-- ---------- ALTER examples (schema evolution) ----------
ALTER TABLE users  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE tours  ADD COLUMN cover_emoji VARCHAR(8) DEFAULT NULL;
ALTER TABLE guides ADD COLUMN rating DECIMAL(2,1) DEFAULT NULL;
ALTER TABLE guides ADD CONSTRAINT chk_guide_rating CHECK (rating IS NULL OR rating BETWEEN 0 AND 5);

-- ---------- DROP example (demonstration of DROP on a scratch object) ----------
CREATE TABLE temp_scratch (id INT PRIMARY KEY);
DROP TABLE temp_scratch;
