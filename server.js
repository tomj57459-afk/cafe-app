const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const db = new sqlite3.Database("cafe.db");

db.serialize(() => {

  db.run(`CREATE TABLE IF NOT EXISTS menu_items(
    item_name TEXT PRIMARY KEY,
    price INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bills(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total INTEGER,
    date TEXT
  )`);

  db.run(`DELETE FROM menu_items`);

  db.run(`INSERT INTO menu_items VALUES 
    ('Burger',180),
    ('Pizza',250),
    ('Pasta',200),
    ('Shake',150),
    ('Sandwich',160)
  `);
});

// MENU
app.get("/menu", (req, res) => {
  db.all("SELECT * FROM menu_items", [], (err, rows) => {
    res.json(rows);
  });
});

// ADD ITEM
app.post("/add-item", (req, res) => {
  const { name, price } = req.body;

  db.run("INSERT OR REPLACE INTO menu_items VALUES (?,?)",
    [name, Number(price)],
    () => res.json({ msg: "Added" })
  );
});

// DELETE ITEM
app.post("/delete-item", (req, res) => {
  const { name } = req.body;

  db.run("DELETE FROM menu_items WHERE item_name=?",
    [name],
    () => res.json({ msg: "Deleted" })
  );
});

// BILL WITH DISCOUNT (FINAL FIX)
app.post("/bill", (req, res) => {

  const cart = req.body.cart || {};
  let discount = req.body.discount;

  if (discount === undefined || discount === "") discount = 0;
  discount = Number(discount);

  let total = 0;
  for (let item in cart) {
    total += Number(cart[item]);
  }

  let final = total - (total * discount / 100);
  final = Math.round(final);

  let date = new Date().toLocaleString();

  db.run("INSERT INTO bills(total, date) VALUES (?,?)",
    [final, date],
    () => {
      res.json({
        total: total,
        discount: discount,
        final: final
      });
    }
  );
});

// REPORT
app.get("/report", (req, res) => {
  db.all("SELECT * FROM bills", [], (err, rows) => {
    res.json(rows);
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));