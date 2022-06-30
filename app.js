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

//Global Variables
var sectionlist =[]
const teacherMap = new Map();
const times = ["A", "B", "C", "D", "E", "F", "G"]
const sched = [0,0,0,0,0,0,0]
const coursesToSched = []
const studentRequests = new Map();
const studentMap = new Map();

const client = new Client({
  user: 'daniellebodine',
  host: 'localhost',
  database: 'school',
  password: 'secretpassword',
  port: 5432,
})

client.connect()

app.post('/jsondata', (req, res) => {
  client.query("UPDATE sections SET time = $1 WHERE course_id = $2 and sec_number = $3", [req.body.time, req.body.course, req.body.secNum], (error, result) => {
    if(error) {
      console.log(error)
    }
    else{
      console.log("success")
    }
  })
})


//Insert data from csv into sections
app.post('/data', (req, res) => {
  var sectionlist = []
  for(var i =0; i < req.body.data.length; i++)
  {
    client.query("INSERT INTO sections VALUES ($1, $2, $3, $4)", 
      [req.body.data[i].course_id,req.body.data[i].sec_number,req.body.data[i].time, 0 ])
  }
  for(var i =0; i < req.body.data.length; i++)
  {
    client.query("INSERT INTO teacher_schedule VALUES ($1, $2, $3)",
      [req.body.data[i].course_id, req.body.data[i].sec_number, req.body.data[i].teacher_id])
  }
  //This does not work, how to get page to reload...
  res.redirect('/')
})


//Add student data to database
app.post('/sched', (req, res) => {
  for(var i =0; i < req.body.data.length; i++)
  {
    var stu = req.body.data[i].student_id;
    client.query("INSERT INTO requests VALUES($1, $2, $3)", [req.body.data[i].math, stu, false])
    client.query("INSERT INTO requests VALUES($1, $2, $3)", [req.body.data[i].english, stu, false])
    client.query("INSERT INTO requests VALUES($1, $2, $3)", [req.body.data[i].science, stu, false])
    client.query("INSERT INTO requests VALUES($1, $2, $3)", [req.body.data[i].history, stu, false])
    client.query("INSERT INTO requests VALUES($1, $2, $3)", [req.body.data[i].pe, stu, false])
    client.query("INSERT INTO requests VALUES($1, $2, $3)", [req.body.data[i].WL, stu, false])
    client.query("INSERT INTO requests VALUES($1, $2, $3)", [req.body.data[i].elective1, stu, false])
    client.query("INSERT INTO requests VALUES($1, $2, $3)", [req.body.data[i].elective2, stu, false])
    if(req.body.data[i].elective3 != 0){
    client.query("INSERT INTO requests VALUES($1, $2, $3)", [req.body.data[i].elective3, stu, false])}
  }
})

//Receive Data on courses to schedule
app.post('/', (req, res) => {
  if(!coursesToSched.includes(req.body.courseID)){
    coursesToSched.push(req.body.courseID);
    scheduleCourse(req.body.courseID)
  }
  console.log(coursesToSched)

  //Need to reload page!!!
  res.render('index', {'sectionlist': sectionlist})
})

function scheduleCourse(s){
  console.log(s)
  //Find Course in section list
  //Find Teachers -- Check periods teachers are free
  //Get students signed up for course --count how many are free
  for(var i=0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].course_id == s)
    {
      sectionlist[i].time = 'A'
    }
  }
}
//Get student info
app.get('/students', (req, res) =>{
  var students = []
  client
    .query('SELECT student_id, first_name, last_name, grade FROM students;')
    .then(result => {
      for(var i=0; i <result.rows.length;i++)
      {
        var stu = {
          'id': result.rows[i].student_id,
          'grade': result.rows[i].grade,
          'first': result.rows[i].first_name,
          'last': result.rows[i].last_name,
        }
        
        students.push(stu)
      }
      res.render('students', {'stu':students})
    })
    .catch(e => console.log(e))
})

//Get specific student schedule based on ID
app.get('/students/:id', (req, res) =>{
  var requests = []
  client
    .query('SELECT requests.course_id, courses.name FROM requests INNER JOIN courses ON courses.course_id = requests.course_id WHERE student_id = '+ req.params.id)
    .then(result => {
      for(var i =0; i < result.rows.length; i++)
      {
        var request = {
          'id': result.rows[i].course_id,
          'name': result.rows[i].name,
        }
        console.log("Hello")
        requests.push(request)
      }
      res.render('studentSched', {'requests': requests})

    })

})

//Get teachers
app.get('/teachers', (req, res) =>{
  var teacherSched = []
  var t = 'Teachers'
  
  res.render('teachers', {'tea':t,'teacherSched':teacherSched })
})

//Get teacher Schedule
app.post('/teachers', (req, res)=> {
  console.log("teacher post")
  var teacherSched = []
  console.log(req.body.name)
  client
    .query('SELECT courses.name, sections.sec_number, courses.course_id, teacher_schedule.course_id, last_name, teachers.teacher_id, time FROM sections INNER JOIN courses ON courses.course_id = sections.course_id INNER JOIN teacher_schedule ON sections.sec_number = teacher_schedule.sec_number and sections.course_id = teacher_schedule.course_id INNER JOIN teachers ON teachers.teacher_id = teacher_schedule.teacher_id WHERE LOWER(last_name) =LOWER($1)', [req.body.name])
    .then(result => {
      for(var i=0; i < result.rows.length; i++)
      {
        var teacherSection = {
          'name': result.rows[i].name,
          'sec_num': result.rows[i].sec_number,
          'time': result.rows[i].time,
        }
        teacherSched.push(teacherSection)
        console.log(teacherSection)
      }
      res.render('teachers', {'tea': req.body.name, 'teacherSched':teacherSched})
    })
    .catch(e => console.log(e))
})

//Dont Need???
app.get('/studentSched', (req, res)=> {
  var stuSched = []
  console.log(req.body.stu)
  res.render('studentSched')
})

app.get('/', (req, res) => {
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
    if(!teacherMap.has(result.rows[i].teacher_id)) {
          teacherMap.set(result.rows[i].teacher_id, sched);
    }
    if(times.includes(result.rows[i].time)) {
      var ind = times.indexOf(result.rows[i].time);
      teacherMap.get(result.rows[i].teacher_id)[ind]=1;
    }
    sectionlist.push(section)
    }
    //console.log(teacherMap);
    res.render('index', {'sectionlist': sectionlist})
  })
    .catch(e => console.log(e))

    client
      .query('SELECT * from requests')
      .then(result => {
        var stuReq = []
        for(var i =0; i < result.rows.length; i++){
          if(!studentRequests.has(result.rows[i].student_id)){
            stuReq = []
            studentRequests.set(result.rows[i].student_id, stuReq)
            studentRequests.get(result.rows[i].student_id).push(result.rows[i].course_id);
          }
          else{
            studentRequests.get(result.rows[i].student_id).push(result.rows[i].course_id);
          }
          if(!studentMap.has(result.rows[i].student_id)){
            studentMap.set(result.rows[i].student_id, sched);
          }
        }
      })
      .catch(e => console.log(e))
  })  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

