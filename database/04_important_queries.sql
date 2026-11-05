-- Important queries for the demo.  Run:  mysql -u root -p travel_tour_db < database/04_important_queries.sql
USE travel_tour_db;

-- Q1  JOIN + ORDER BY: tour catalogue with destination and guide
SELECT t.title, d.name AS destination, g.name AS guide, t.price, t.start_date
FROM tours t JOIN destinations d ON d.destination_id = t.destination_id
LEFT JOIN guides g ON g.guide_id = t.guide_id ORDER BY t.start_date;

-- Q2  FULL-TEXT search
SELECT tour_id, title, MATCH(title, description) AGAINST ('waterfalls tea' IN NATURAL LANGUAGE MODE) AS score
FROM tours WHERE MATCH(title, description) AGAINST ('waterfalls tea' IN NATURAL LANGUAGE MODE) ORDER BY score DESC;

-- Q3  GROUP BY + aggregate: revenue per destination (via view)
SELECT * FROM v_revenue_by_destination ORDER BY revenue DESC;

-- Q4  GROUP BY + HAVING: customers who spent more than 30,000
SELECT u.name, COUNT(*) AS bookings, SUM(b.total_amount) AS spent
FROM users u JOIN bookings b ON b.user_id = u.user_id AND b.status <> 'cancelled'
GROUP BY u.user_id, u.name HAVING SUM(b.total_amount) > 30000 ORDER BY spent DESC;

-- Q5  Subquery: tours priced above the average tour price
SELECT title, price FROM tours WHERE price > (SELECT AVG(price) FROM tours) ORDER BY price DESC;

-- Q6  Correlated subquery: tours that have never been booked
SELECT t.title FROM tours t
WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.tour_id = t.tour_id AND b.status <> 'cancelled');

-- Q7  Stored function
SELECT title, fn_tour_revenue(tour_id) AS revenue FROM tours ORDER BY revenue DESC;

-- Q8  View over 4 tables
SELECT * FROM v_booking_details;

-- Q9  Transaction demo (stored procedure) + trigger effect
CALL sp_book_tour(2, 3, 2, 'card', @new_id);
SELECT @new_id AS booking_id;
SELECT title, available_seats FROM tours WHERE tour_id = 3;      -- seats reduced by trigger
CALL sp_cancel_booking(@new_id, 2, FALSE);
SELECT title, available_seats FROM tours WHERE tour_id = 3;      -- seats restored by trigger
SELECT * FROM payments WHERE booking_id = @new_id;                -- status = refunded
SELECT * FROM audit_log ORDER BY log_id DESC LIMIT 5;

-- Q10 Constraint / trigger failures (each should raise an error)
-- CALL sp_book_tour(2, 3, 99, 'card', @x);                      -- Not enough seats available
-- UPDATE tours SET price = -5 WHERE tour_id = 1;                -- violates chk_price
-- DELETE FROM tours WHERE tour_id = 1;                          -- blocked if confirmed bookings exist

-- Q11 Index usage
EXPLAIN SELECT * FROM tours WHERE destination_id = 1 AND start_date >= '2026-12-01';
