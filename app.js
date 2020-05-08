//jshint esversion:6


// set up requirements
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

// initialize express
const app = express();


// set up ejs from views folder
app.set('view engine', 'ejs');

// use bodyparser within express

app.use(bodyParser.urlencoded({
  extended: true
}));

// use public folder for external stylesheet and attachments

app.use(express.static("public"));

// connect to MongoDB

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

// create items schema and initialize model for to do list

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);


// create list schema and initialize model to store custom lists with express routing parameters
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// create default list

const item1 = new Item({
  name: "Welcome to your todolist"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<--- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];



app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length === 0) {
      // Code for inserting default items into DB if they aren't already there and redirecting to home page
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Sucessfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      // code for rendering home page if default items are already in
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create New List
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else{
        //Show An Existing List
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req, res) {

  // save new item and list name

  const itemName = req.body.newItem;

  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName == "Today"){

    // save to default list if it's there
    item.save();
    res.redirect("/");

  } else{

    //save to express parameter's list if not
    List.findOne({name: listName}, function(err, foundList){
      if(!err){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});

app.post("/delete", function(req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item successfully deleted");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull : {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect('/' + listName);
      }
     });
  }


  });




app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
