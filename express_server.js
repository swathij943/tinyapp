const express = require("express");
const app = express();
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const PORT = 8080; // default port 8080

//helper functions
const { getUserByEmail } = require('./helpers');

const { urlsForUser } = require("./helpers");

const cookieParser = require("cookie-parser");

app.use(cookieSession({
  name: "session",
  keys: ['e1d50c4f-538a-4682-89f4-c002f10a59c8', '2d310699-67d3-4b26-a3a4-1dbf2b67be5c']
}));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function generateRandomString() {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

//All Routings

app.get("/", (req, res) => {
  res.send("Hello!");
});

//home page routing

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    const templateVars = { user: user, errorMessage: "Please log in or register first" };
    res.render("urls_index", templateVars);
  } else {
    const userURLs = urlsForUser(userId, urlDatabase);
    const templateVars = { urls: userURLs, user: user };
    res.render("urls_index", templateVars);
  }
});

//access 'Create URL' page

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  res.render("urls_new", templateVars);
});

//URL routing

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  const userId = req.session.user_id;
  const user = users[userId];

  // Check if the user is logged in
  if (!user) {
    res.status(401).send("Please log in or register first");
    return;
  }

  // Check if the URL exists
  if (!url) {
    res.status(404).send("URL not found");
    return;
  }

  // Check if the URL belongs to the user
  if (url.userID !== userId) {
    res.status(403).send("You do not own this URL");
    return;
  }

  const longURL = url.longURL;
  const templateVars = {
    id: shortURL,
    longURL: longURL,
    user: user,
  };
  res.render("urls_show", templateVars);
});

//to access site

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];

  if (url) {
    const longURL = url.longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("URL not found");
  }
});

//create new URL
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: userID,
  };
  res.redirect(`/urls/${shortURL}`);
});

//URL delete routing

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  const userId = req.session.user_id;
  const user = users[userId];

  // Check if the URL exists
  if (!url) {
    res.status(404).send("URL not found");
    return;
  }

  // Check if the user is logged in
  if (!user) {
    res.status(401).send("Please log in or register first");
    return;
  }

  // Check if the user owns the URL
  if (url.userID !== userId) {
    res.status(403).send("You do not own this URL");
    return;
  }

  // Delete the URL from the database
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//URL edit routing
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const newLongURL = req.body.longURL;
  const url = urlDatabase[shortURL];

  if (url) {
    url.longURL = newLongURL;
    res.redirect("/urls");
  } else {
    res.status(404).send("URL not found");
  }
});

//get & validate login

app.get("/login", (req, res) => {
  res.render("urls_login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Helper function to find user by email
  const findUserByEmail = (email) => {
    for (const userId in users) {
      if (users[userId].email === email) {
        return users[userId];
      }
    }
    return null;
  };

  // Look up user by email
  const user = findUserByEmail(email);

  // Check if user with that email exists
  if (!user) {
    res.status(403).send("Email not found");
    return;
  }

  // Check if password matches
  if (!bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Incorrect password");
    return;
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//get & create new profile

app.get("/register", (req, res) => {
  res.render("urls_registration");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // Check if email or password are empty strings
  if (email === "" || password === "") {
    res.status(400).send("Email or password cannot be empty");
    return;
  }

  // Helper function to find user by email
  const findUserByEmail = (email) => {
    for (const userId in users) {
      if (users[userId].email === email) {
        return users[userId];
      }
    }
    return null;
  };

  // Check if email already exists in users object
  if (findUserByEmail(email)) {
    res.status(400).send("Email already registered");
    return;
  }

  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: userId,
    email,
    password: hashedPassword,
  };
  users[userId] = newUser;
  req.session.user_id = userId;
  res.redirect("/urls");
});

//listening port

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});