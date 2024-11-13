const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root-password",
  database: "math_course",
});

// Add helper function for tracking progress
db.trackProgress = async (userId, exerciseId) => {
  try {
    const [result] = await db
      .promise()
      .query("INSERT INTO progress (user_id, exercise_id) VALUES (?, ?)", [
        userId,
        exerciseId,
      ]);
    return result;
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      // Progress already exists, not an error
      return null;
    }
    throw err;
  }
};


db.connect((err) => {
  if (err) throw err;
});

module.exports = db;