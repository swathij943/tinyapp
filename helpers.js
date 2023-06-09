const bcrypt = require("bcryptjs");

const getUserByEmail = function(email, database) {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const generateRandomString = function() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const urlsForUser = function(userId, database) {
  const userURLs = {};
  for (const shortURL in database) {
    const url = database[shortURL];
    if (url.userID === userId) {
      userURLs[shortURL] = url;
    }
  }
  return userURLs;
};

const comparePasswords = function(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
};

const displayError = (message, user, statusCode, res) => {
  const error = { errorMsg: message, user, statusCode};
  res.render('urls_error', error);
  return;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser, comparePasswords, displayError };