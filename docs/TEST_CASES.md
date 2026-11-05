# Test Cases

| ID | Area | Steps | Expected result |
|----|------|-------|-----------------|
| T01 | Auth | Register with a valid name, email, 8+ char password | Account created, logged in, role = customer |
| T02 | Auth | Register with the same email twice | Error "That value already exists" (UNIQUE constraint) |
| T03 | Auth | Register with a 5-character password | Rejected (validation) |
| T04 | Auth | Log in with a wrong password | "Incorrect email or password" |
| T05 | RBAC | Log in as customer, open `/admin` | "This area is for admins" and `/api/admin/stats` returns 403 |
| T06 | RBAC | Call `POST /api/tours` as customer | 403 |
| T07 | RBAC | Call `GET /api/bookings` without logging in | 401 |
| T08 | Search | Type "waterfalls" on the home page | Munnar tour appears (FULLTEXT) |
| T09 | Filter | Difficulty = hard, max price 50,000 | Only the Ladakh tour |
| T10 | Booking | Book 2 seats on tour 1 | Booking confirmed, seats left decreases by 2 (trigger) |
| T11 | Booking | Book more seats than available | Error "Not enough seats available", nothing inserted (transaction rolled back) |
| T12 | Booking | Book 11 seats | Rejected (`chk_bseats`, API validation) |
| T13 | Booking | Book all remaining seats | Tour status flips to `closed` (trigger) |
| T14 | Cancel | Cancel a confirmed booking | Status cancelled, seats restored, payment `refunded`, audit row written |
| T15 | Cancel | Customer A cancels customer B's booking (API) | Error "Not allowed to cancel this booking" |
| T16 | Cancel | Cancel an already cancelled booking | Error "Only confirmed bookings can be cancelled" |
| T17 | Integrity | Admin deletes a tour with confirmed bookings | Blocked by trigger `trg_tour_before_delete` |
| T18 | Integrity | Admin creates tour with end date before start date | Rejected by `chk_dates` |
| T19 | Integrity | Admin creates tour with negative price | Rejected by `chk_price` |
| T20 | NoSQL | Review a tour you have not booked | 403 "Book this tour before reviewing it" |
| T21 | NoSQL | Review a booked tour twice | 409 "already reviewed" (unique index on tourId+userId) |
| T22 | NoSQL | Open admin overview | Top rated tours, review tags and most viewed tours come from MongoDB aggregations |
| T23 | Concurrency | Two customers book the last seat at the same time | One succeeds, the other gets "Not enough seats" (`SELECT ... FOR UPDATE` lock) |
| T24 | Config | Search source for passwords | No credentials in code; all in `.env.local` |

Record actual results and screenshots for each test in the final report (Testing Results section).
