//git add .
//git commit -m "Comment"
//git push

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
var teacherMap = new Map();
var studentSchedule = new Map();
var times = ["A", "B", "C", "D", "E", "F", "G"]

var coursesToSched = []
var studentRequests = new Map();
var courseRequests = new Map();
var studentMap = new Map();
var x = 0;
var start = 0

const client = new Client({
  user: 'daniellebodine',
  host: 'localhost',
  database: 'school',
  password: 'secretpassword',
  port: 5432,
})

client.connect()

//Update time of section in database
app.post('/jsondata', (req, res) => {
  for(var i =0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].course_id == req.body.course && sectionlist[i].sec_num == req.body.secNum)
    {
      sectionlist[i].edit = false
      console.log(sectionlist[i].edit)
    }
  }
  client.query("UPDATE sections SET time = $1 WHERE course_id = $2 and sec_number = $3", [req.body.time, req.body.course, req.body.secNum], (error, result) => {
    if(error) {
      console.log(error)
    }
    else{
      console.log("success")
    }
  })
})


app.post('/test', (req, res) => {
  res.json({time: "A"})
})

app.get('/data', (req, res) => {
  res.render('data')

  })

//Insert data from csv into sections
app.post('/data1', (req, res) => {
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
  console.log("POST worked!!!")
})

//Send student and teacher data to client
app.post("/scheduler", (req, res) => {
  console.log("Post Scheduler")
  const objTM = Object.fromEntries(teacherMap)
  const objSM = Object.fromEntries(studentMap)
  const objRM = Object.fromEntries(courseRequests)
  res.json({sections:sectionlist, teacherMap:objTM, studentMap:objSM, courseRequests: objRM})
})

app.post("/save", (req, res) => {
  client
    .query("DELETE FROM student_schedule")
    .catch(e => console.log(e))
  studentMap = new Map(Object.entries(req.body.studentSched))
  sectionlist = Object.entries(req.body.sections)
  //Could modify so only update ones that have been changed...
  /*
  for(var i =0; i < sectionlist.length; i++)
  {
    client
      .query("UPDATE sections SET time = $1, num_students = $2 WHERE course_id = $3 and sec_number = $4", [sectionlist[i].time, sectionlist[i].num_stud, sectionlist[i].course_id, sectionlist[i].sec_num])
      .catch(e => console.log(e))
  }
  */
  studentMap.forEach((value, key) => {
    var id = key
    var sched = value.sections
    for(var k =0; k < sched.length; k++)
    {
      if(sched[k]!=null){
        client
          .query("INSERT INTO student_schedule VALUES ($1, $2, $3)", [sched[k].course_num, sched[k].secNum, id])
          .catch(e => console.log(e))
      }
    }
  })
console.log("studentMap" +studentMap)
  console.log("inside save" + sectionlist)
})

app.post('/edit', (req, res) => {
  console.log("EDIT")
  for(var i =0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].course_id == req.body.courseID && sectionlist[i].sec_num == req.body.secNum)
    {
      sectionlist[i].edit = true
      console.log(sectionlist[i].edit)
    }
  }
})



//Get student info, display on student page
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
  console.log(req.params.id)
  var requests = studentRequests.get(parseInt(req.params.id))
  console.log(requests)
  var actualReq = []
  for(var i =0; i < requests.length; i++)
  {
    for(var j =0; j < sectionlist.length; j++)
    {
      if(requests[i] == sectionlist[j].course_id){
              var r = {
                'id': requests[i],
                'name': sectionlist[j].name
              }
              j = sectionlist.length
      }
    }
    actualReq.push(r)
        }
  var sched = []
  client
    .query('SELECT student_schedule.course_id, student_schedule.sec_number, sections.time, teacher_schedule.teacher_id FROM student_schedule INNER JOIN sections ON student_schedule.course_id = sections.course_id AND student_schedule.sec_number = sections.sec_number INNER JOIN teacher_schedule ON teacher_schedule.course_id = student_schedule.course_id AND student_schedule.sec_number = teacher_schedule.sec_number WHERE student_schedule.student_id = '+ req.params.id)
    .then(result => {
      for(var i =0; i < result.rows.length; i++)
      {
        var sect = {
          'id': result.rows[i].course_id,
          'secNum': result.rows[i].sec_number,
          'time': result.rows[i].time,
          'teacher': result.rows[i].teacher_id,
          'name': " ",
          'teacher_name': " ",
        }
        for(var j =0; j<sectionlist.length; j++)
        {
          if(sectionlist[j].course_id == sect.id && sectionlist[j].sec_num == sect.secNum)
          {
            sect.name = sectionlist[j].name
            sect.teacher_name = sectionlist[j].teacher
          }
        }

        sched.push(sect)
      }
      res.render('studentSched', {'requests': actualReq, 'schedule': sched})

    })
})

//Get teachers
app.get('/teachers', (req, res) =>{
  var teachers = []
  var teacherSched = []
  var t = 'Teachers'
  client 
    .query('SELECT teacher_id, first_name, last_name, department FROM teachers')
    .then(result => {
      for(var i =0; i < result.rows.length; i++)
      {
        var teacher = {
          'id': result.rows[i].teacher_id,
          'fname': result.rows[i].first_name,
          'lname': result.rows[i].last_name,
          'dept': result.rows[i].department,
        }
        teachers.push(teacher)
      }
      res.render('teachers', {'tea':t,'teacherSched':teacherSched, 'listOfTeachers': teachers })
    })
  
})


app.get('/teachers/:id', (req, res) =>{
var teacherSched = []
  client
    .query('SELECT courses.name, sections.sec_number, courses.course_id, teacher_schedule.course_id, last_name, teachers.teacher_id, time FROM sections INNER JOIN courses ON courses.course_id = sections.course_id INNER JOIN teacher_schedule ON sections.sec_number = teacher_schedule.sec_number and sections.course_id = teacher_schedule.course_id INNER JOIN teachers ON teachers.teacher_id = teacher_schedule.teacher_id WHERE teachers.teacher_id= '+req.params.id)
    .then(result => {
      for(var i=0; i < result.rows.length; i++)
      {
        var name = result.rows[i].last_name
        var teacherSection = {
          'id': result.rows[i].course_id,
          'name': result.rows[i].name,
          'sec_num': result.rows[i].sec_number,
          'time': result.rows[i].time,
        }
        teacherSched.push(teacherSection)
      }
      res.render('teacherSched', {'ts':teacherSched, 'lname': name})
    })
  })




//Get teacher Schedule
app.post('/teachers', (req, res)=> {
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




app.get('/scheduler', (req, res) =>{
  sectionlist = []
  client
    .query('SELECT sections.course_id, sections.sec_number, time, grade, num_students, courses.name, teachers.last_name, teacher_schedule.teacher_id FROM courses INNER JOIN sections ON courses.course_id = sections.course_id INNER JOIN teacher_schedule ON teacher_schedule.course_id = sections.course_id AND teacher_schedule.sec_number = sections.sec_number INNER JOIN teachers ON teacher_schedule.teacher_id = teachers.teacher_id;')
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
      'grade': result.rows[i].grade,
      'edit': true,
    } 
    if(!teacherMap.has(result.rows[i].teacher_id)) {
      var teacherInfo = {
        'name': result.rows[i].last_name,
        'sched': [0,0,0,0,0,0,0],
        'sections': [],
      }
      teacherMap.set(result.rows[i].teacher_id, teacherInfo);
    }
    if(times.includes(result.rows[i].time)) {
      var ind = times.indexOf(result.rows[i].time);
      teacherMap.get(result.rows[i].teacher_id).sched[ind]=1;
    }
    sectionlist.push(section)
    }
    res.render('scheduler', {'sectionlist': sectionlist})
  })
    .catch(e => console.log(e))
    if(start ==0){
      client
      .query('SELECT * from requests')
      .then(result => {
        var stuReq = []
        var courseReq = []
        for(var i =0; i < result.rows.length; i++){
          if(!studentRequests.has(result.rows[i].student_id)){
            stuReq = []
            studentRequests.set(result.rows[i].student_id, stuReq)
            studentRequests.get(result.rows[i].student_id).push(result.rows[i].course_id);
          }
          else{
            studentRequests.get(result.rows[i].student_id).push(result.rows[i].course_id);
          }
          if(!courseRequests.has(result.rows[i].course_id)){
            courseReq = []
            courseRequests.set(result.rows[i].course_id, courseReq)
            courseRequests.get(result.rows[i].course_id).push(result.rows[i].student_id);
          }
          else{
            courseRequests.get(result.rows[i].course_id).push(result.rows[i].student_id);
          }
        }
        for(var i =0; i < result.rows.length; i++){
          if(!studentMap.has(result.rows[i].student_id)){
            var studentInfo ={
              'requests': studentRequests.get(result.rows[i].student_id),
              'sched': [0,0,0,0,0,0,0],
              'sections': [],
            }
            studentMap.set(result.rows[i].student_id, studentInfo);
          }
      }
    })
    .catch(e => console.log(e))
  }
    start++;
})

app.get('/', (req, res) => {
  res.render('index')
  })  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

