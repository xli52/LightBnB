SELECT reservations.id AS id, title, start_date, cost_per_night, AVG(rating) AS average_rating
FROM users
JOIN reservations ON users.id = guest_id
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON property_reviews.property_id = properties.id
WHERE users.id = 1
GROUP BY properties.id, reservations.id
ORDER BY start_date
LIMIT 10;