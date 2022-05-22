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
  for(var i =0; i < req.body.data.length; i++)
  {
    console.log(req.body.data[i].teacher_id)
    console.log(req.body.data[i].course_id)
    client.query("INSERT INTO teacher_schedule VALUES ($1, $2, $3)",
      [req.body.data[i].course_id, req.body.data[i].sec_number, req.body.data[i].teacher_id])
  }
  //This does not work, how to get page to reload...
  res.redirect('/')
})

app.get('/students', (req, res) =>{
  console.log("students")
  res.render('students')
})
app.get('/teachers', (req, res) =>{
  var teacherSched = []
  
  console.log("teachers")
  res.render('teachers')
})
app.post('/teachers', (req, res)=> {

  console.log(req.body.teacher)
  res.redirect("/teachers")
})

app.get('/', (req, res) => {
  var sectionlist =[]

  client
    .query('SELECT sections.course_id, sections.sec_number, time, num_students, courses.name, teachers.last_name, teacher_schedule.teacher_id FROM courses INNER JOIN sections ON courses.course_id = sections.course_id INNER JOIN teacher_schedule ON teacher_schedule.course_id = sections.course_id AND teacher_schedule.sec_number = sections.sec_number INNER JOIN teachers ON teacher_schedule.teacher_id = teachers.teacher_id;')
    .then(result =>  {
      for(var i =0; i < result.rows.length; i++){ 
      var section = {
      'course_id': result.rows[i].course_id,
      'name' : result.rows[i].name,
      'sec_num': result.rows[i].sec_number,
      'time': result.rows[i].time,
      'teacherID': result.rows[i].teacher_id,
      'teacher': result.rows[i].last_name,
      'numStud': result.rows[i].num_students,
    } 
    sectionlist.push(section)

    }
    res.render('index', {'sectionlist': sectionlist})
  })
    .catch(e => console.log(e))
  })

      
/**
    for(const obj of sectionlist)
      {
    client
      .query('SELECT teacher_id FROM teacher_schedule WHERE course_id = $1 and sec_number = $2', [obj.course_id, obj.sec_num])
      .then(result => {
        client
          .query('SELECT last_name FROM teachers WHERE teacher_id = $1', [result.rows[0].teacher_id])
          .then(result => {
            obj.teacher=result.rows[0].last_name
          })
          .catch(e => console.log(e))
      })
      .catch(e => console.log(e))
    }
  
**/
  //res.render('index', {'sectionlist': sectionlist})
  //console.log(sectionlist.length)



  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

