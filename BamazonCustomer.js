var mysql = require('mysql');
var inquirer = require('inquirer');

var items = [];


function item(productname, departmentname, price, stockquantity, id) {
  this.productname = productname;
  this.departmentname = departmentname;
  this.price = price;
  this.stockquantity = stockquantity;
  this.id = id;
}

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root", 
  password: "", 
  database: "bamazon" 
})

// This is the actual connection process used to connect to the mysql database
connection.connect(function(err) {
  if (err) throw err;
  console.log("connected as id " + connection.threadId);
  // Once the connection is made I run my first function
  // This function will display the products from the mysql server
  // I also run the function after the connection is made so there aren't any text conflicts
  displayitems();
})

// This is the function that grabs and stores data from the table in mysql
function displayitems() {
  // Here the query is set to return everything from the products table in mysql
  connection.query('SELECT * FROM `products`', {
  }, function(error, results) {
    // This is just a little note that will display to the user the number of items in stock
    console.log('There are ' + results.length + ' products in stock.');
    // This is just an empty space to make it easier to read
    console.log('');
    // After I run a for loop that goes through the results and creates an item with the item constructor
    // the item is simultaneously stored in the items array that was initially empty
    for (var i=0; i<results.length; i++) {
      // I don't need to set a variable because the items[i] will store the constructor within the array at index i
      // If you wish to see the array console.log(items) & console.log(results) too see the similarities
      items[i] = new item(results[i].ProductName, results[i].DepartmentName, results[i].Price, results[i].StockQuantity, results[i].ItemID);
      // I also console log the items in a neat fashion to make it easier to read to the user
      console.log('ID: ' + results[i].ItemID);
      console.log('Product Name: ' + results[i].ProductName);
      console.log('Department Name: ' + results[i].DepartmentName);
      console.log('Price: $' + results[i].Price);
      console.log('Stock Quantity: ' + results[i].StockQuantity);
      // This is just a space for each item so the text isn't all stacked on each other
      console.log('');
    }
    // Once the stock is stored and displayed to the user I can run the next function to prompt the initial
    // question to the user which will ask which product they would like to purchase
    // I am also passing in the length of the results array so I can validate for the amount of items in stock.
    insertID(results.length);
  })
}

// This is the function ran to prompt the user which product they would like to purchase
// the products parameter is being used to validate that the user doesn't insert an ID
// higher than what exists in the inventory
function insertID(products) {
  var idQuestion = [
    {
      type: 'input',
      name: 'id',
      message: 'Type the ID number of the product you wish to buy (insert a number)',
      // Here is the validation for the user's input. They must type a number that is greater than 0 and less than
      // or equal to the maximum amount of products in stock
      validate: function(value) {
        var valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0 && parseFloat(value) <= products;
        return valid || 'Please enter a valid ID';
      }
    }
  ]
  inquirer.prompt(idQuestion).then(function(answers) {
    // Once the user selects a product id, that id is passed into the next function
    // this is used to select the correct product and also grab information from the array of items
    // a Math.floor() is also added just in case the user types in a number with a decimal
    // this will simply remove the decimal from the number
    checkStock(Math.floor(answers.id));
  })
}

// This function will check the selected item with the corresponding id and then return how many items are currently in stock
function checkStock(id) {
  console.log(id);
  // Since I passed in the id of the product the user chose, I can now check my array of items to see
  // how many items are currently in stock
  for (var i=0; i<items.length; i++) {
    if (items[i].id == id) {
      // When an id is matched I can grab the information from that item with items[i]
      // now that I have the exact number of items in stock for that item I can prompt the next question
      // I use a function to prompt the next question because I can easily pass in that stock value with a parameter
      // I also passed in price & producname as an extra, but its not necessarily needed for the assignment
      // The id is passed in to update the mysql database
      insertUnit(items[i].stockquantity, items[i].price, items[i].productname, items[i].id);
    }
  }
}

// This function will prompt the user how many units of that item they wish to purchase
function insertUnit(stock, price, name, id) {
  // First I display the amount of items currently in stock to the user
  console.log('We currently have ' + stock + ' more in stock.');
  var unitQuestion = [
    {
      type: 'input',
      name: 'units',
      message: 'How many would you like to purchase? (insert a number)',
      // This is validation to check the number inserted a number that is greater than 0 and less than or equal
      // to the current amount of items in stock
      validate: function(value) {
        var valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0 && parseFloat(value) <= stock;
        return valid || 'Insufficient Quantity. Please enter a valid number';
      }
    }
  ]
  inquirer.prompt(unitQuestion).then(function(answers) {
    // Once the user enters the amount they wish to purchase, the information is recorded for the user
    // I also use Math.floor() just in case the user entered any decimals
    // that number is than multiplied with the price of the item to show how much the user spent
    var total = parseInt(price) * Math.floor(answers.units);
    // I also have to inquire the new stock for that purchased item by subtracting the current stock by
    // how many the user bought
    var instock = parseInt(stock) - answers.units
    console.log('You purchased ' + answers.units + ' ' + name + '(s) for a total of $' + total + '.');
    // Next is to update the stock in the mysql database
    connection.query('UPDATE `products` SET ? WHERE ?', 
      [{
        // This is the SET part, in which I'm setting the stockquantity to the new stock
        StockQuantity: instock
      },
      {
        // This is the WHERE part, which sets the stockquantity based on the matching ids
        ItemID: id
      }]
    , function(err, res) {
      if (err) throw err
    })

    // Once the purchase has been finalized the user is prompted the final question which is
    // ran in the checkout function
    checkout();
  })
}

// After the user makes their purchase I reprompt them if they would like to make another purchase
// if not then the connection is ended
function checkout() {
  var checkoutQuestion = [
    {
      type: 'confirm',
      name: 'checkout',
      message: 'Woudld you like to purchase another item?',
      default: false
    }
  ]
  inquirer.prompt(checkoutQuestion).then(function(answers) {
    // If user enters true then the inventory is redisplayed
    if (answers.checkout) {
      displayitems();
    }
    else {
      console.log('Thank you for shopping');
      connection.end();
    }
  })
}