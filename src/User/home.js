const express = require("express");
const router = express.Router();
const mysql = require("mysql2");

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hotelbluebird", // change to your actual DB name
});

db.connect(err => {
  if (err) console.error("❌ Database connection failed:", err);
  else console.log("✅ Connected to MySQL database.");
});

// Middleware to check session
function checkLogin(req, res, next) {
  if (req.session.usermail) next();
  else res.redirect("/login");
}

// Render home page
router.get("/", checkLogin, (req, res) => {
  res.render("home", { usermail: req.session.usermail });
});

// Reservation form submission
router.post("/reserve", (req, res) => {
  const {
    Name,
    Email,
    Country,
    Phone,
    RoomType,
    Bed,
    NoofRoom,
    Meal,
    cin,
    cout,
  } = req.body;

  if (!Name || !Email || !Country) {
    return res.send(`<script>alert("Fill the proper details!"); window.history.back();</script>`);
  }

  const sql = `
    INSERT INTO roombook 
    (Name, Email, Country, Phone, RoomType, Bed, NoofRoom, Meal, cin, cout, stat, nodays)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NotConfirm', DATEDIFF(?, ?))
  `;

  db.query(
    sql,
    [Name, Email, Country, Phone, RoomType, Bed, NoofRoom, Meal, cin, cout, cout, cin],
    (err, result) => {
      if (err) {
        console.error("❌ MySQL Error:", err);
        return res.send(`<script>alert("Something went wrong!"); window.history.back();</script>`);
      }
      res.send(`<script>alert("Reservation successful!"); window.location.href='/';</script>`);
    }
  );
});

// Logout route
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;
