const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const axios = require("axios");

// Create Express app
const app = express();
const PORT = 3000;

// Middleware for reading post requests and serving html/js
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public")); // server everything in this folder automatically

// SQLite setup
const dbPromise = open({ // open returns a promise when looking for the database on the server
    filename: "./users.db",
    driver: sqlite3.Database
});

// immediately invoked function, just to include `async` essentially
(async () => {
    // wait to find the db and stash it in the variable `db`
    const db = await dbPromise;
    // create the database if it doesn't exist with a primary key for id that increments, probably not great to do but whatever
    // we have to use `exec` here because this does not return any data
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users ( 
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            age INTEGER
        )   
    `);
})();

// Routes 
app.get("/pokemon/:pokemon", async (req, res) => {
    const pokemonName = req.params.pokemon;

    try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}/`);

        const pokemonData = {
            name: response.data.name,
            shinySprite: response.data.sprites.front_shiny
        }

        res.json(pokemonData) // send will send messages and stuff as test
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch pokemon" });
    }
})


app.get("/api/users", async (req, res) => {
    const db = await dbPromise;

    // here we use `db.all` because we are returning data. this function is for SELECT statements
    const users = await db.all("SELECT * FROM users");
    res.json(users); // return the table as a json
});

app.post("/api/users", async (req, res) => {
    const { name, age } = req.body;

    if (!name || !age) return res.status(400).send("Missing name or age");

    const db = await dbPromise;
    await db.run("INSERT INTO users (name, age) VALUES (?, ?)", [name, age]); // this is the syntax to run here 
    res.send("User created!");
});

// serve the main page
app.get("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public/index.html"));
});

app.listen(PORT);