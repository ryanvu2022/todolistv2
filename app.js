const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Create new database called 'todolistDB' inside mongoDB
mongoose.connect("mongodb+srv://<username>:<password>@<clustername>.9ihmvef.mongodb.net/todolistDB");
// Create Item Schema for home route - constructor
const itemsSchema = new mongoose.Schema({
  name: String
});

// Create a Model for home route
const Item = mongoose.model("Item", itemsSchema);

// Create List Schema for dynamic routing parameters - constructor
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// Create a Model for dynamic routing parameters
const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {    // targeting the home route
  const day = date.getDate();

  Item.find({}, (err, foundItems) => {
    res.render("list", {
      listTitle: day,
      newListItems: foundItems
    });
  })
})

// Express Routing Parameters:
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: []
        })
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  })
})

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ 
    name: itemName 
  });

  if (listName === date.getDate()) {    // in default list
    item.save();
    res.redirect("/");
  } else {      // in custom list
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
})

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === date.getDate()) {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {        
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
})

app.listen(process.env.PORT || 3000, () => {
  console.log("To-Do List Version 1 Server is running successfully.")
})