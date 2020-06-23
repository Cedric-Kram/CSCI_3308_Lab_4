/***********************
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

//Create Database Connection
var pgp = require('pg-promise')();

/**********************
  Database Connection information
  host: This defines the ip address of the server hosting our database.  We'll be using localhost and run our database on our local machine (i.e. can't be access via the Internet)
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab, we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database.  You'll need to set a password USING THE PSQL TERMINAL THIS IS NOT A PASSWORD FOR POSTGRES USER ACCOUNT IN LINUX!
**********************/
const dbConfig = {
	host: 'localhost',
	port: 5432,
	database: 'football_db',
	user: 'postgres',
	password: ''
};

var db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory



/*********************************
 Below we'll add the get & post requests which will handle:
   - Database access
   - Parse parameters from get (URL) and post (data package)
   - Render Views - This will decide where the user will go after the get/post request has been processed

 Web Page Requests:

  Login Page:        Provided For your (can ignore this page)
  Registration Page: Provided For your (can ignore this page)
  Home Page:
  		/home - get request (no parameters)
  				This route will make a single query to the favorite_colors table to retrieve all of the rows of colors
  				This data will be passed to the home view (pages/home)

  		/home/pick_color - post request (color_message)
  				This route will be used for reading in a post request from the user which provides the color message for the default color.
  				We'll be "hard-coding" this to only work with the Default Color Button, which will pass in a color of #FFFFFF (white).
  				The parameter, color_message, will tell us what message to display for our default color selection.
  				This route will then render the home page's view (pages/home)

  		/home/pick_color - get request (color)
  				This route will read in a get request which provides the color (in hex) that the user has selected from the home page.
  				Next, it will need to handle multiple postgres queries which will:
  					1. Retrieve all of the color options from the favorite_colors table (same as /home)
  					2. Retrieve the specific color message for the chosen color
  				The results for these combined queries will then be passed to the home view (pages/home)

  		/team_stats - get request (no parameters)
  			This route will require no parameters.  It will require 3 postgres queries which will:
  				1. Retrieve all of the football games in the Fall 2018 Season
  				2. Count the number of winning games in the Fall 2018 Season
  				3. Count the number of lossing games in the Fall 2018 Season
  			The three query results will then be passed onto the team_stats view (pages/team_stats).
  			The team_stats view will display all fo the football games for the season, show who won each game,
  			and show the total number of wins/losses for the season.

  		/player_info - get request (no parameters)
  			This route will handle a single query to the football_players table which will retrieve the id & name for all of the football players.
  			Next it will pass this result to the player_info view (pages/player_info), which will use the ids & names to populate the select tag for a form
************************************/

// login page
app.get('/', function(req, res) {
	res.render('pages/login',{
		local_css:"signin.css",
		my_title:"Login Page"
	});
});

// registration page
app.get('/register', function(req, res) {
	res.render('pages/register',{
		my_title:"Registration Page"
	});
});

/*Add your other get/post request handlers below here: */
// 3.1., 3.2.
app.get('/home', function(req, res) {
	var query = 'select * from favorite_colors;';
	db.any(query)
        .then(function (rows) {
            res.render('pages/home',{
				          my_title: "Home Page",
				          data: rows,
				          color: '',
				          color_msg: ''
			      })
        })
        .catch(function (err) {
            console.log('error', err);
            response.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
        })
});
//3.5
app.get('/home/pick_color', function(req, res) {
	var color_choice = req.query.color_selection; // Investigate why the parameter is named "color_selection"
  //console.log(color_choice);
	var color_options =  'SELECT * FROM favorite_colors;';// Write a SQL query to retrieve the colors from the database
	var color_message =  "SELECT color_msg FROM favorite_colors WHERE hex_value = '" + color_choice + "';";
	db.task('get-everything', task => {
        return task.batch([
            task.any(color_options),
            task.any(color_message)
        ]);
    })
    .then(info => {
    	res.render('pages/home',{
				my_title: "Home Page",
				data: info[0], // Return the color options
				color: color_choice, // Return the color choice
				color_msg: info[1][0].color_msg // Return the color message
			})
    })
    .catch(err => {
            console.log('------------------------------Hello');
            console.log('error', err);

            response.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
    });

});

app.post('/home/pick_color', function(req, res) {
	var color_hex = req.query.color_hex;
	var color_name = req.query.color_name;
	var color_message = req.query.color_message;
	var insert_statement = 'INSERT INTO favorite_colors (hex_value,name,color_msg) ' +
                         " VALUES ('" + color_hex +"','"+ color_name + "','" + color_message+ "');";
	var color_select = 'SELECT * FROM favorite_colors;'; // Write a SQL statement to retrieve all of the colors in the favorite_colors table

	db.task('get-everything', task => {
        return task.batch([
            task.any(insert_statement),
            task.any(color_select)
        ]);
    })
    .then(info => {
    	res.render('pages/home',{
				my_title: "Home Page",
				data: info[1],// Return the color choices
				color: color_hex,// Return the hex value of the color added to the table
				color_msg: color_message // Return the color message of the color added to the table
			})
    })
    .catch(err => {
            console.log('error', err);
            response.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
    });
});

app.get('/team_stats', function(req,res){
  var all_games =     "SELECT * FROM football_games;";
  var winning_games = "SELECT COUNT (*) FROM football_games WHERE home_score > visitor_score;";
  var losing_games =  "SELECT COUNT (*) FROM football_games WHERE home_score < visitor_score;";
  db.task('get-everything', task => {
    return task.batch([
      task.any(all_games),
      task.any(winning_games),
      task.any(losing_games)
    ])
  })
  .then(info =>{
    res.render('pages/team_stats',{
      my_title: "Team Stats",
      data_all:  info[0],
      data_win:  info[1],
      data_lose: info[2]
    })
  })
  .catch(err => {
    console.log('---------- ERRROR STARTS ----------'),
    console.log('error',err),
    res.render('pages/team_stats',{
      my_title: 'Team Stats Error',
      data_all:  '',
      data_win:  '',
      data_lose: ''
    })
  });
});

app.get('/player_info',function(req,res){
  var player_query = "SELECT * FROM football_players;";
  db.any(player_query)
    .then(function(info){
      res.render('pages/player_info',{
        my_title: "Player Info",
        data: info,
        player_data: '',
        num_game: ''
      })
    })
    .catch(function (err){
      console.log('error',err);
      res.render('page/player_info',{
        my_title: 'Player Info',
        data: '',
        player_data: '',
        num_game: 0
      })
    })
});

app.get('/player_info/post',function(req,res){
  var id = req.query.player_choice
  var all_player_query ='SELECT name,id FROM football_players;';
  var id_query =        'SELECT * FROM football_players WHERE id = ' + id;
  var id_games =        'SELECT COUNT(*) FROM football_games WHERE '+ id +'= ANY (players);';
  db.task('get-everything', task =>{
    return task.batch([
      task.any(all_player_query),
      task.any(id_query),
      task.any(id_games)
    ])
  })
  .then(data =>{
    res.render('pages/player_info',{
      my_title: 'Player Info',
      data: data[0],
      player_data: data[1][0],
      num_game: data[2][0].count
    })
  })
});

app.listen(3000);
console.log('3000 is the magic port');
