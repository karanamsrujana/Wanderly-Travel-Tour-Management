-- =====================================================================
-- Views, Stored Procedures, Functions, Triggers
-- Run:  mysql -u root -p travel_tour_db < database/02_programmability.sql
-- =====================================================================
USE travel_tour_db;

-- ======================== VIEWS ========================
CREATE OR REPLACE VIEW v_tour_catalog AS
SELECT t.tour_id, t.title, t.description, t.price, t.duration_days, t.start_date, t.end_date,
       t.difficulty, t.status, t.available_seats, t.max_seats, t.cover_emoji,
       d.destination_id, d.name AS destination, d.country,
       g.name AS guide_name
FROM tours t
JOIN destinations d ON d.destination_id = t.destination_id
LEFT JOIN guides g  ON g.guide_id = t.guide_id;

CREATE OR REPLACE VIEW v_booking_details AS
SELECT b.booking_id, b.user_id, u.name AS customer, u.email,
       t.tour_id, t.title AS tour, t.start_date, d.name AS destination,
       b.seats, b.total_amount, b.status, b.booking_date,
       p.method AS payment_method, p.status AS payment_status
FROM bookings b
JOIN users u ON u.user_id = b.user_id
JOIN tours t ON t.tour_id = b.tour_id
JOIN destinations d ON d.destination_id = t.destination_id
LEFT JOIN payments p ON p.booking_id = b.booking_id;

CREATE OR REPLACE VIEW v_revenue_by_destination AS
SELECT d.destination_id, d.name AS destination, COUNT(b.booking_id) AS bookings,
       COALESCE(SUM(b.seats),0) AS seats_sold, COALESCE(SUM(b.total_amount),0) AS revenue
FROM destinations d
LEFT JOIN tours t ON t.destination_id = d.destination_id
LEFT JOIN bookings b ON b.tour_id = t.tour_id AND b.status <> 'cancelled'
GROUP BY d.destination_id, d.name;

-- ======================== FUNCTION + TRIGGERS + PROCEDURES ========================
DROP FUNCTION IF EXISTS fn_tour_revenue;
DROP TRIGGER IF EXISTS trg_booking_before_insert;
DROP TRIGGER IF EXISTS trg_booking_after_insert;
DROP TRIGGER IF EXISTS trg_booking_after_update;
DROP TRIGGER IF EXISTS trg_tour_before_delete;
DROP PROCEDURE IF EXISTS sp_book_tour;
DROP PROCEDURE IF EXISTS sp_cancel_booking;

DELIMITER $$
CREATE FUNCTION fn_tour_revenue(p_tour INT) RETURNS DECIMAL(12,2)
READS SQL DATA
BEGIN
  DECLARE v DECIMAL(12,2);
  SELECT COALESCE(SUM(total_amount),0) INTO v
  FROM bookings WHERE tour_id = p_tour AND status <> 'cancelled';
  RETURN v;
END$$

-- 1. Validate seats before a booking row is inserted
CREATE TRIGGER trg_booking_before_insert BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  DECLARE v_avail INT; DECLARE v_status VARCHAR(10);
  SELECT available_seats, status INTO v_avail, v_status FROM tours WHERE tour_id = NEW.tour_id;
  IF v_status <> 'open' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tour is not open for booking';
  END IF;
  IF NEW.seats > v_avail THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not enough seats available';
  END IF;
END$$

-- 2. Reduce seats after booking, auto-close tour when full, write audit row
CREATE TRIGGER trg_booking_after_insert AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
  UPDATE tours SET available_seats = available_seats - NEW.seats,
         status = IF(available_seats - NEW.seats = 0, 'closed', status)
  WHERE tour_id = NEW.tour_id;
  INSERT INTO audit_log(table_name, action, record_id, details)
  VALUES ('bookings','INSERT',NEW.booking_id, CONCAT('user ',NEW.user_id,' booked ',NEW.seats,' seat(s) on tour ',NEW.tour_id));
END$$

-- 3. Restore seats + refund when a booking is cancelled
CREATE TRIGGER trg_booking_after_update AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
    UPDATE tours SET available_seats = available_seats + NEW.seats,
           status = IF(status = 'closed', 'open', status)
    WHERE tour_id = NEW.tour_id;
    UPDATE payments SET status = 'refunded' WHERE booking_id = NEW.booking_id;
    INSERT INTO audit_log(table_name, action, record_id, details)
    VALUES ('bookings','CANCEL',NEW.booking_id, CONCAT('booking cancelled, ',NEW.seats,' seat(s) released'));
  END IF;
END$$

-- 4. Block deleting a tour that still has confirmed bookings
CREATE TRIGGER trg_tour_before_delete BEFORE DELETE ON tours
FOR EACH ROW
BEGIN
  IF EXISTS (SELECT 1 FROM bookings WHERE tour_id = OLD.tour_id AND status = 'confirmed') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete tour with confirmed bookings';
  END IF;
END$$

-- Book seats: locks the tour row, inserts booking + payment atomically
CREATE PROCEDURE sp_book_tour(IN p_user INT, IN p_tour INT, IN p_seats INT,
                              IN p_method VARCHAR(12), OUT p_booking_id INT)
BEGIN
  DECLARE v_price DECIMAL(10,2); DECLARE v_total DECIMAL(12,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
    SELECT price INTO v_price FROM tours WHERE tour_id = p_tour FOR UPDATE;  -- row lock prevents overbooking
    IF v_price IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Tour not found';
    END IF;
    SET v_total = v_price * p_seats;
    INSERT INTO bookings(user_id, tour_id, seats, total_amount) VALUES (p_user, p_tour, p_seats, v_total);
    SET p_booking_id = LAST_INSERT_ID();
    INSERT INTO payments(booking_id, amount, method, status) VALUES (p_booking_id, v_total, p_method, 'paid');
  COMMIT;
END$$

-- Cancel a booking (owner or admin) inside a transaction
CREATE PROCEDURE sp_cancel_booking(IN p_booking INT, IN p_user INT, IN p_is_admin BOOLEAN)
BEGIN
  DECLARE v_status VARCHAR(12); DECLARE v_owner INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
    SELECT status, user_id INTO v_status, v_owner FROM bookings WHERE booking_id = p_booking FOR UPDATE;
    IF v_owner IS NULL THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking not found';
    END IF;
    IF v_owner <> p_user AND NOT p_is_admin THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Not allowed to cancel this booking';
    END IF;
    IF v_status <> 'confirmed' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only confirmed bookings can be cancelled';
    END IF;
    UPDATE bookings SET status = 'cancelled' WHERE booking_id = p_booking;  -- trigger restores seats & refunds
  COMMIT;
END$$
DELIMITER ;
