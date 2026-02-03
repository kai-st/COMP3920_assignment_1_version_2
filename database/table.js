const database = require("../databaseConnection");

async function createUserTable() {
  let createUserSQL = `
		CREATE TABLE IF NOT EXISTS user (
            user_id INT NOT NULL AUTO_INCREMENT,
            username VARCHAR(500) NOT NULL,
            password VARCHAR(100) NOT NULL,
            PRIMARY KEY (user_id),
            UNIQUE INDEX unique_username (username ASC) VISIBLE);
	`;

  try {
    const results = await database.query(createUserSQL);

    console.log("Successfully created user table");
    console.log(results[0]);
  } catch (err) {
    console.error("Error creating user table");
    console.error(err);
  }
}

async function clearUserTable() {
  let deleteAllUserSQL = `
		DELETE FROM user;
	`;

  try {
    const results = await database.query(deleteAllUserSQL);

    console.log("Successfully cleared user table");
    console.log(results[0]);
  } catch (err) {
    console.error("Error clearing user table");
    console.error(err);
  }
}

async function reset_database() {
  await createUserTable();
  await clearUserTable();
}

module.exports = { createUserTable, clearUserTable, reset_database };
