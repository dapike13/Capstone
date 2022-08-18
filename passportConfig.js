const LocalStrategy = require('passport-local').Strategy;
const {Client} = require('pg')
const bcrypt = require("bcrypt")

/*
const client = new Client({
  user: 'daniellebodine',
  host: 'localhost',
  database: 'school',
  password: 'secretpassword',
  port: 5432,
})
*/



const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});



client.connect()


function initialize(passport){
	const authenticateUser = (email, password, done) => {
		client.query('SELECT * FROM users WHERE email = $1', [email], (error, results) => {
			if(error){
				console.log(error)
			}
			console.log(results.rows)
			if(results.rows.length > 0){
				const user = results.rows[0]
				bcrypt.compare(password, user.password, (error, isMatch) =>{
					if(error){
						console.log(error)
					}
					if(isMatch){
						return done(null, user);
					}
					else{
						return done(null, false, {message: "Password not correct"})
					}
				})
			}
			else{
				return done(null, false, {message: "Email not found"})
			}
		})
	}
	passport.use(new LocalStrategy(
		{
		usernameField: 'email',
		passwordField: 'password'
		},
		authenticateUser
	))
	passport.serializeUser((user, done) => done(null, user.id))
	passport.deserializeUser((id, done) => {
		client.query("SELECT * FROM users WHERE id = $1", [id], (error, results) => {
			if(error){
				console.log(error)
			}
			return done(null, results.rows[0])
		})
	})
}

module.exports = initialize;