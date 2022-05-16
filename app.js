const express = require('express')
const app = express()

const {Client} = require('pg')
const port = 3000

const bodyParser = require("body-parser")
//Look this up
app.use(bodyParser.urlencoded({extend:false}))
app.use(bodyParser.json())
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
app.post('/jsondata', (req, res) => {
  //res.json({msg: 'Hi ${req.body.time'})
  client.query("UPDATE sections SET time = $1 WHERE course_id = $2 and sec_number = $3", [req.body.time, req.body.course, req.body.secNum], (error, result) => {
    if(error) {
      console.log(error)
    }
    else{
      console.log("success")
    }
  })
})

app.post('/data', (req, res) => {


  var sectionlist = []
  for(var i =0; i < req.body.data.length; i++)
  {
    client.query("INSERT INTO sections VALUES ($1, $2, $3, $4, $5)", 
      [req.body.data[i].course_id,req.body.data[i].sec_number,req.body.data[i].time, 0, req.body.data[i].name  ])
    
  }
  res.redirect('/')
})


app.get('/', async (req, res) => {
  var sectionlist =[]
  await client.query('SELECT * from sections', (error, result) => {
    if(error){
      console.log(error)
    }
    else{
      for(var i =0; i < result.rows.length; i++)
      { 
        var section = {
      'course_id': result.rows[i].course_id,
      'name' : result.rows[i].name,
      'sec_num': result.rows[i].sec_number,
      'time': result.rows[i].time,
    }
    sectionlist.push(section)  

      }
      addNames(sectionlist)
      //console.log(sectionlist)
  }
  res.render('index', {'sectionlist': sectionlist})
})

})
  
function addNames(sList)
{
  console.log("The length is "+ sList.length)
  for(const obj of sList)
  {
    client
      .query('SELECT name FROM courses WHERE course_id = $1', [obj.course_id])
      .then(result => {
        obj.name=result.rows[0].name
        //console.log("First")

      })
      .catch(e => console.log(e))
    }
    //console.log(sList)
  }
    

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

