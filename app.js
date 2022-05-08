const express = require('express')
const app = express()

const {Client} = require('pg')
const port = 3000

app.set('view engine', 'pug')
app.use(express.static('views'));

const client = new Client({
  user: 'daniellebodine',
  host: 'localhost',
  database: 'school',
  password: 'secretpassword',
  port: 5432,
})

client.connect()



app.post('/clicked',(req, res) => {
  console.log("Function")

  /*
  client.query("INSERT INTO courses(num, name, dept, period) VALUES(102, 'geometry', 'math', 'E')", (error, result) => {
    if(error){
      console.log(error)
    }
    else{
      console.log("sucesss")}
})
*/
})

app.post('/', (req, res) => {
  const d = req.data;
})



app.get('/', (req, res) => {

  var courselist =[]
  client.query('SELECT * from courses', (error, result) => {
    if(error){
      console.log(error)
    }
    else{
      for(var i =0; i < result.rows.length; i++)
      {
        var course = {
        'course_id':result.rows[i].course_id,
        'name':result.rows[i].name,
        'department':result.rows[i].department,
        'credits':result.rows[i].credits,
        'core':result.rows[i].core,
        'grade':result.rows[i].grade,
        'sections':result.rows[i].sections,
        'room':result.rows[i].room,

    }
    courselist.push(course)
      }
    res.render('index', {'courselist': courselist})
  }
})
  
})
  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
