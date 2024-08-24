const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const cors = require("cors"); // Import cors middleware
const server = express();
const session = require('express-session');
const cookieParser = require('cookie-parser');


// Enable CORS for all origins
server.use(cors());
server.use(bodyParser.json());
server.use(express.urlencoded({ extended: true }));
server.use(cookieParser());
//Test  Server if it Work
server.get('/',(req,res)=>{
  res.send("SERVER IS UNDER MAINTANANCE")
})
// Establish a database connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hotel_api",
});

// Check for connection
connection.connect(function (error) {
  if (error) {
    console.log("Error connecting to database");
  } else {
    console.log("Successfully connected to database");
  }
});
// Create session to hold user information
server.use(session({
  secret: 'hotel_app', // Replace with a secure secret
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1 * 60 * 1000 } // Set to 1 minute for testing
  // cookie: { maxAge: 1 * 60 * 1000 } // Cookie expires in 5 minutes
  // cookie: { maxAge: 3600000 } // Cookie expires in 1 hour
}));

// Step 2.2: Store and Retrieve Booking Information
// Update the booking creation endpoint to store booking information in the session:

//post api for booking for create
server.post("/booking/create", (req, res) => {
  const now = new Date();
  const bookingInterval = 60000; // 1 minute
  const bookingLimit = 2;

  // Initialize session bookings if not present
  if (!req.session.bookings) {
    req.session.bookings = [];
  }
// Create session to hold user information
server.use(session({
  secret: 'hotel_app', // Replace with a secure secret
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 1000 } // Set to 1 minute for testing
  // cookie: { maxAge: 1 * 60 * 1000 } // Cookie expires in 5 minutes
  // cookie: { maxAge: 3600000 } // Cookie expires in 1 hour
}));

// Step 2.2: Store and Retrieve Booking Information
// Update the booking creation endpoint to store booking information in the session:

//post api for booking for create
server.post("/booking/create", (req, res) => {
  const now = new Date();
  const bookingInterval = 60000; // 1 minute
  const bookingLimit = 2;

  // Initialize session bookings if not present
  if (!req.session.bookings) {
    req.session.bookings = [];
  }

  // Check booking limits
  const recentBookings = req.session.bookings.filter(booking => now - new Date(booking.timestamp) < bookingInterval);
  if (recentBookings.length >= bookingLimit) {
    return res.send({ status: false, message: "Booking limit reached. Try again later." });
  }

  // Booking details from request
  const details = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    room: req.body.room,
    duration: req.body.duration,
    hotel_id: req.body.hotel_id,
    region_id: req.body.region_id,
    book_no: req.body.book_no,
    start_date: req.body.start_date,
    end_date: req.body.end_date
  };

  // Insert booking into database
  const qry = "INSERT INTO booking SET ?";
  connection.query(qry, details, (error) => {
    if (error) {
      console.log(error);
      res.send({ status: false, message: "Booking failed." });
    } else {
      // Store booking in session
      req.session.bookings.push({ ...details, timestamp: now });
      res.send({ status: true, message: "Booking successful." });
    }
  });
});

  // Check booking limits
  const recentBookings = req.session.bookings.filter(booking => now - new Date(booking.timestamp) < bookingInterval);
  if (recentBookings.length >= bookingLimit) {
    return res.send({ status: false, message: "Booking limit reached. Try again later." });
  }

  // Booking details from request
  const details = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    room: req.body.room,
    duration: req.body.duration,
    hotel_id: req.body.hotel_id,
    region_id: req.body.region_id,
    book_no: req.body.book_no,
    start_date: req.body.start_date,
    end_date: req.body.end_date
  };

  // Insert booking into database
  const qry = "INSERT INTO booking SET ?";
  connection.query(qry, details, (error) => {
    if (error) {
      console.log(error);
      res.send({ status: false, message: "Booking failed." });
    } else {
      // Store booking in session
      req.session.bookings.push({ ...details, timestamp: now });
      res.send({ status: true, message: "Booking successful." });
    }
  });
});





server.get("/booking", (req,res) => {
  var qry = "select * from booking";

    connection.query(qry, (error, result) => {
    if (error) {
      res.send({ status: false, message: "Booking cannot be viewed" });
    } else {
      res.send({ status: true, data: result });
    }
  });

});

//post api to create a hotel
server.post("/hotel/create", (req,res)=>{
  let details = {
    name: req.body.name,
    region_id: req.body.region_id
  };

  let qry = "insert into hotel set ?";
  connection.query(qry,details,(error) =>{
    if (error) {
      res.send({ status: false, message: "Hotel failed to be added"});
    }
    res.send({ status: true, message: "Hotel added successful"});
  });

});

// GET API to fetch hotels by region
server.get('/hotel', (req, res) => {
  const regionId = parseInt(req.query.region_id, 10);
  console.log('Fetching hotels for region:', regionId);

  let qry = `
    SELECT hotel.*,
           COUNT(room.id) as available_rooms,
           SUM(CASE WHEN room.type = 'single' THEN 1 ELSE 0 END) as single_rooms,
           SUM(CASE WHEN room.type = 'double' THEN 1 ELSE 0 END) as double_rooms
    FROM hotel
    LEFT JOIN room ON room.hotel_id = hotel.id
    WHERE hotel.region_id = ?
    GROUP BY hotel.id;
  `;

  connection.query(qry, [regionId], (error, result) => {
    if (error) {
      console.error('Database query error:', error);
      res.status(500).send({ status: false, message: 'Unable to fetch hotels.' });
    } else {
      console.log('Query Result:', result);
      res.send({ status: true, data: result });
    }
  });
});


// PUT API to update a hotel by ID
server.put("/hotel/update/:id", (req, res) => {
  var hotelId = req.params.id;
  var newName = req.body.name;

  var qry = "update hotel set name = ? where id = ?";
  connection.query(qry, [newName, hotelId], (error) => {
    if (error) {
      res.send({
        status: false,
        message: "Hotel update failed",
      });
    } else {
      res.send({ status: true, message: "Hotel updated successfully" });
    }
  });
});

//post api to create a region
server.post("/region/create", (req,res)=>{
  let details = { name: req.body.name};

  let qry = "insert into region set ?";
  connection.query(qry,details,(error) =>{
    if (error) {
      res.send({ status: false, message: "Region failed to be added"});
    }
    res.send({ status: true, message: "Region added successful"});
  });

});
//************************************************************************************************* */

  server.get('/region', (req, res) => {
                const regionName = req.query.name;

                if (!regionName) {
                  return res.status(400).send({ status: false, message: 'Region name is required' });
                }

                // Query to fetch regions based on partial region name, case-insensitive
                const query = `
                  SELECT id, name
                  FROM region
                  WHERE LOWER(name) LIKE LOWER(?)
                `;

                // Using `%${regionName}%` to match any part of the region name
                connection.query(query, [`%${regionName}%`], (error, results) => {
                  if (error) {
                    console.error('Database query error:', error);
                    return res.status(500).send({ status: false, message: 'An error occurred while searching for regions' });
                  }

                  if (results.length > 0) {
                    res.send({ status: true, data: results });
                  } else {
                    res.send({ status: false, message: 'No regions found for the specified name' });
                  }
                });
              });


//*************************************************** */
//post api for create location
server.post("/location/create", (req,res)=>{
  let details = {
    name: req.body.name,
    region_id: req.body.region_id
  };

  let qry = "insert into location set ?";
  connection.query(qry,details,(error) =>{
    if (error) {
      res.send({ status: false, message: "Location failed to be added"});
    }
    res.send({ status: true, message: "Location added successful"});
  });

});

//api to view location
server.get("/location", (req,res) => {
  var qry = "select * from location";

    connection.query(qry, (error, result) => {
    if (error) {
      res.send({ status: false, message: "Region cannot be viewed" });
    } else {
      res.send({ status: true, data: result });
    }
  });

});

/*
 * Before pushing the booking into the database, we first fetch the region by name
 * in order to get the id of that region that will then going to be recorded into the
 * booking relation through this API endpoint
*/
// API endpoint to get region ID by region name
server.get('/region/id', (req, res) => {
  const regionName = req.query.name;

  if (!regionName) {
    return res.status(400).send({ status: false, message: 'Region name is required' });
  }

  // Use wildcards for partial matching
  const query = 'SELECT * FROM region WHERE name LIKE ?';
  const wildcardRegionName = `%${regionName}%`;  // Adding wildcards

  connection.query(query, [wildcardRegionName], (error, results) => {
    if (error) {
      console.error('Database query error:', error);
      return res.status(500).send({ status: false, message: 'An error occurred while fetching region ID' });
    }

    if (results.length > 0) {
      res.send({ status: true, data: results[0].id, name: results[0].name });
    } else {
      res.send({ status: false, message: 'Region not found' });
    }
  });
});



  //API endpoint for the room availability in each hotel
  // API endpoint to get total bookings and available rooms for each hotel and room type
  server.get("/available", (req, res) => {
    const region_id = req.query.region_id;

    // SQL query to fetch available hotels and rooms
    const qry = `
      SELECT
        h.id AS hotel_id,
        h.name AS hotel_name,
        r.id AS room_id,
        r.type AS room_type,
        r.price AS room_price,
        (r.total_rooms - COALESCE(COUNT(b.id), 0)) AS available_rooms
      FROM
        room r
      JOIN
        hotel h ON r.hotel_id = h.id
      LEFT JOIN
        booking b ON r.id = b.room
        AND (b.start_date < now() AND b.end_date > now())
      WHERE
        r.is_available = 1
        AND h.region_id = ?
      GROUP BY
        h.id, r.id, r.type, r.price
      HAVING
        available_rooms > 0;
    `;

    //removed start_date and end_date and added region_id

    connection.query(qry, [region_id], (error, result) => {
      if (error) {
        console.error('Database query error:', error);
        return res.status(500).send({ status: false, message: 'Unable to fetch room availability.' });
      }

      res.send({ status: true, data: result });
    });
  });

//API endpoint for submitting inquiry to the complaints table
server.post('/inquiry', (req, res) => {
  const {customDesc} = req.body;
  const {fullname} = req.body;
  const {phone} = req.body;
  console.log(req.body);

  if(customDesc && fullname && phone) {
    const qry = "INSERT INTO complain(fullname, phone, customDesc) VALUES(?, ?, ?)";
    connection.query(qry, [fullname, phone, customDesc], (error) => {
      if(error) {
        console.log(error);
        res.send({ status: false, message: 'failed to submit inquiry'});
      } else {
        res.send({ status: true, message: 'inquiry submitted successfully' });
      }
    });
  } else {
    return res.status(400).send({ status: false, message: 'Please enter your inquiry'});
  }
});

server.get('/rooms', (req, res) => {
  const hotelId = req.query.hotel_id;

  if (!hotelId) {
    return res.status(400).send({ status: false, message: 'Hotel ID is required.' });
  }

  const qry = `SELECT * FROM room WHERE hotel_id = ?`;

  connection.query(qry, [hotelId], (error, result) => {
    if (error) {
      console.error('Database query error:', error);
      return res.status(500).send({ status: false, message: 'Unable to fetch rooms.' });
    }

    res.send({ status: true, data: result });
  });
});

// Specify the port
server.listen(3000, function check(error) {
  if (error) {
    console.log("Error.....!!!");
  } else {
    console.log("Started...!!!");
  }
});
