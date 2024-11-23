const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const authMiddleware = require("./middleware/auth");
const mysql = require("mysql2");
const path = require("path");

const app = express();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root-password",
  database: "math_course",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
});

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(authMiddleware.loadUser);
const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

const authRoutes = require("./routes/auth");
const topicRoutes = require("./routes/topics");

app.use("/", authRoutes);
app.use("/topics", topicRoutes);

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
