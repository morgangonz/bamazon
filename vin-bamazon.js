var mysql = require('mysql');
var inquirer = require('inquirer');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root", //Your username
    password: "hello", //Your password
    database: "bamazon"
})

connection.connect(function(err) {
    //if (err) throw err;
    console.log("connected as id " + connection.threadId);
    displayItems();
})
    
function displayItems() {
     connection.query("SELECT * FROM products", function(err, results) {
     console.log('there are ' + results.length + 'products in stock.');   
     console.log('');
     for (var i=0; i<results.length; i++){
        /*items[i] = new item(results[i].ProductName, 
            results[i].DepartmentName, 
            results[i].Price, 
            results[i].StockQuantity, 
            results[i].ItemID);*/
        console.log('ID: ' + results[i].itemID);
        console.log('Product Name: ' + results[i].ProductName);
        console.log('Department Name: ' + results[i].DeptName);
        console.log('Price: $' + results[i].Price);
        console.log('Stock Quantity: ' + results[i].StockQuantity);
        console.log('');
     }
     userInput();
    })  
};    

function userInput() {
    inquirer.prompt({
        name: "id",
        type: "input",
        message: "What is the id number of the product you wish to buy?",
    }).then(function(value) {
            var valid = !isNaN(parseFloat(value)) && parseFloat(value) > 0 // && parseFloat(value) <= products;
            return valid || 'Please enter a valid ID';
        });   
};