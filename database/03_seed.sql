-- Sample data (users are created by scripts/seed.js so passwords are bcrypt-hashed)
USE travel_tour_db;

INSERT INTO destinations (name, country, region, description, best_season) VALUES
('Munnar','India','Kerala','Rolling tea estates, mist-covered hills and waterfalls in the Western Ghats.','Sep - Mar'),
('Jaipur','India','Rajasthan','The Pink City of forts, palaces and bustling bazaars.','Oct - Mar'),
('Leh-Ladakh','India','Ladakh','High-altitude desert, monasteries, turquoise lakes and epic mountain passes.','Jun - Sep'),
('Andaman Islands','India','Andaman & Nicobar','White-sand beaches, coral reefs and scuba diving.','Nov - May'),
('Kyoto','Japan','Kansai','Ancient temples, geisha districts and bamboo forests.','Mar - May'),
('Bali','Indonesia','Bali','Rice terraces, surf beaches and Hindu temples.','Apr - Oct');

INSERT INTO guides (name, email, phone, languages, experience_years, rating) VALUES
('Ravi Menon','ravi@wanderly.in','9876500001','English, Malayalam, Hindi',8,4.7),
('Meera Shekhawat','meera@wanderly.in','9876500002','English, Hindi',6,4.5),
('Tenzin Dorje','tenzin@wanderly.in','9876500003','English, Ladakhi, Hindi',12,4.9),
('Anil Kumar','anil@wanderly.in','9876500004','English, Hindi, Tamil',5,4.3),
('Haruto Sato','haruto@wanderly.in','9876500005','English, Japanese',9,4.8);

INSERT INTO hotels (destination_id, name, star_rating, price_per_night) VALUES
(1,'Tea Valley Resort',4,5500.00),(1,'Misty Woods Homestay',3,2200.00),
(2,'Haveli Heritage Stay',4,6500.00),(2,'Amer View Inn',3,2800.00),
(3,'Himalayan Camp Leh',3,3500.00),(3,'Pangong Lakeside Tents',2,2500.00),
(4,'Coral Bay Resort',4,7200.00),(5,'Gion Ryokan',5,18000.00),(6,'Ubud Jungle Villa',4,6000.00);

INSERT INTO tours (title, description, destination_id, guide_id, duration_days, price, max_seats, available_seats, start_date, end_date, difficulty, cover_emoji) VALUES
('Munnar Tea Trails & Waterfalls','Walk through tea estates, visit Mattupetty dam and Attukal waterfalls, and enjoy a spice plantation tour.',1,1,4,18500.00,20,20,'2026-12-12','2026-12-15','easy','🍃'),
('Royal Rajasthan: Jaipur Heritage Walk','Explore Amer Fort, City Palace and Hawa Mahal with a local historian, plus a block-printing workshop.',2,2,3,14500.00,25,25,'2026-12-20','2026-12-22','easy','🏰'),
('Ladakh Monastery & Lakes Expedition','Ride over Khardung La, visit Hemis monastery and camp beside Pangong Lake. Acclimatisation day included.',3,3,8,46500.00,12,12,'2027-06-10','2027-06-17','hard','🏔️'),
('Andaman Reef Diving Escape','Beginner-friendly scuba sessions at Havelock, kayaking through mangroves and a sunset at Radhanagar beach.',4,4,5,32000.00,16,16,'2027-01-15','2027-01-19','moderate','🤿'),
('Kyoto Temples & Tea Ceremony','Fushimi Inari at dawn, Arashiyama bamboo grove, a private tea ceremony and a night in a ryokan.',5,5,6,98000.00,10,10,'2027-04-02','2027-04-07','easy','⛩️'),
('Bali Rice Terraces & Surf Camp','Sunrise trek to Mount Batur, Tegallalang terraces, and three surf lessons at Canggu.',6,NULL,7,64000.00,14,14,'2027-05-05','2027-05-11','moderate','🌴');

INSERT INTO tour_hotels (tour_id, hotel_id, nights) VALUES
(1,1,2),(1,2,1),(2,3,2),(3,5,4),(3,6,2),(4,7,4),(5,8,5),(6,9,6);
