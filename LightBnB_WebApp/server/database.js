const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(
      `SELECT * FROM users
      WHERE email = $1;`
      , [email.toLowerCase()]
    )
    .then((result) => {
      if(result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(
      `SELECT * FROM users
      WHERE id = $1;`
      , [id]
    )
    .then((result) => {
      if(result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
  .query(
    `INSERT INTO users
    (name, email, password)
    VALUES
    ($1, $2, $3)
    RETURNING *;`
    , [user.name, user.email, user.password]
  )
  .then((result) => {
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(
      `SELECT * FROM reservations
      JOIN properties ON property_id = properties.id
      WHERE guest_id = $1
      LIMIT $2;`,
      [guest_id, limit]
    )
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    })
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];
  
  let queryString = `
  SELECT properties.*, AVG(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON property_id = properties.id
  WHERE properties.id > 0\n
  `;

  // Add city filter
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND city ILIKE $${queryParams.length}\n`;
  }

  // Add owner filter
  if (options.owner_id) {
    queryParams.push(owner_id);
    queryString += `AND owner_id = $${queryString.length}\n`;
  }

  // Add price range filter
  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `AND cost_per_night >= $${queryParams.length}\n`;
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `AND cost_per_night <= $${queryParams.length}\n`;
  }

  // Add minimum rating filter
  queryString += `GROUP BY properties.id\n`;

  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length}\n`
  }

  // Add the rest of the query
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  // Built the queryParams and queryString
  const queryParams = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night * 100,
    property.street,
    property.city,
    property.province,
    property.post_code,
    property.country,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms
  ];
  let queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES (`;
  for (index in queryParams) {
    queryString += `$${Number(index) + 1}`;
    queryString += (Number(index) === queryParams.length - 1 ? ') RETURNING *;' : ', ');
  }
  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows[0];
    })
    .catch(err => console.log(err.message));
}
exports.addProperty = addProperty;
