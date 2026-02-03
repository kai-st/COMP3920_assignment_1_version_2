const database = require('../databaseConnection');

async function createUser(postData) {
	let createUserSQL = `
		INSERT INTO user
		(username, password)
		VALUES ('${postData.username}', '${postData.hashedPassword}');
	`;
	
	try {
		const results = await database.query(createUserSQL);

        console.log("Successfully created user");
		console.log(results[0]);
		return true;
	}
	catch(err) {
		console.error("Error inserting user");
        console.error(err);
		return false;
	}
}

async function getUser(username) {
	let getUserSQL = `
		SELECT username, password
		FROM user
		WHERE username = '${username}'
	`;

	try {
		const results = await database.query(getUserSQL);

        console.log("Successfully found user");
		console.log(results[0]);
		return results[0];
	}
	catch(err) {
		console.error("Error trying to find user");
        console.error(err);
		return null;
	}
}

module.exports = {createUser, getUser};