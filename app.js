//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _ =require("lodash");

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://root:hackonroot@cluster0.nz2mi.mongodb.net/smarttaskdb?retryWrites=true&w=majority");

const itemsSchema={
  name:String
};

const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
  name:"Welcome to your todolist!"
});

const item2=new Item({
  name:"Hit the + button to add a new item."
});

const item3=new Item({
  name:"<-- Hit this to delete an item."
})

const defaultItems= [item1,item2,item3];


const ListSchema={
  name:String,
  items:[itemsSchema]
};

const List=mongoose.model("List",ListSchema);

app.get("/", function(req, res) {

  Item.find(function(err,foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  })
});

app.get("/:customListName",function(req,res){
  const customListName=_.capitalize(req.params.customListName);

  List.findOne({name:customListName},function(err,found){
    if(!found){
      // Create new list
      const list =new List({
        name:customListName,
        items:defaultItems
      });
      res.redirect("/"+customListName);
    }else{
      res.render("list",{listTitle:found.name,newListItems:found.items})
    }
  })

  const list= new List({
    name:customListName,
    items:defaultItems
  });

  list.save();
})



app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName= req.body.list;

  const item=new Item({
    name:itemName
  });

  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }

});

app.post("/delete",function(req,res){
  const checkedItemId= req.body.checkbox;
  const listName=req.body.listName;

 if(listName==="Today"){
   Item.findByIdAndRemove(checkedItemId,function(err){
     if(!err){
       console.log("Successfully deleted items");
       res.redirect("/");
     }
   });
 }else{
   List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
     if(!err){
       res.redirect("/"+listName);
     }
   });
 }



})


app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT || 3000;



app.listen(port, function() {
  console.log("Server started successfully");
});
