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
var studentMap = new Map();

const client = new Client({
  user: 'daniellebodine',
  host: 'localhost',
  database: 'school',
  password: 'secretpassword',
  port: 5432,
})

client.connect()

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
  res.render('index', {'sectionlist': sectionlist, 'extra': 5})
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

function scheduleCourse(s){
  //console.log(teacherMap)
  console.log("Course to sched:" + s)
  var sectionNums = []
  var teacherID = []
  var studentList = [];  //List of students signed up for the course
  var numStu = 0
  var timesToNum = new Map()
  var course;
  var teacher;
  var indicesOfTimes = [];
  for(var i=0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].course_id == s) //Found course in sectionlist
    {
      sectionNums.push(sectionlist[i].sec_num)
      teacherID.push(sectionlist[i].teacherID)
      course = sectionlist[i].name
    }
  }
  studentRequests.forEach((value, key) => {
        if (value.includes(parseInt(s, 10))) {
          studentList.push(key)
                  }
      })
  for(var i = 0; i<teacherID.length;i++)
  {
    console.log(teacherID[i])
    var availTimes = teacherMap.get(teacherID[i])
    console.log(availTimes)
    for(var j =0; j < availTimes.length;j++)
    {
      numStu = 0;
      if(availTimes[j] == 0)
      {
        for(var k = 0 ; k< studentList.length; k++)
        {
          var stuAvailTimes = studentMap.get(studentList[k])
          if(stuAvailTimes[j]==0){numStu++;}
        }
      }
      timesToNum.set(times[j], numStu)
      console.log(times[j] + numStu)
    }
    var max = 0
    var maxTime;
    timesToNum.forEach((value, key) => {
      if(value > max) {
        max = value
        maxTime = key
      }
    })
    var index = times.indexOf(maxTime)
    indicesOfTimes.push(index)
    availTimes[index] = 1
    console.log("Inside the Loop: "+teacherID[i])
    teacherMap.set(teacherID[i], availTimes)
    for(var q=0; q < sectionlist.length; q++)
    {
      if(sectionlist[q].course_id == s && sectionlist[q].sec_num == sectionNums[i])
      {
        sectionlist[q].time = maxTime
        sectionlist[q].edit = false
      }
    }
}
console.log(indicesOfTimes)
    while(studentList.length!=0)
    {
      var randIndex = Math.floor(Math.random()*indicesOfTimes.length)
      var stuAvailTimes = studentMap.get(studentList[0])
      while(stuAvailTimes[randIndex] != 0)
      {
        randIndex = Math.floor(Math.random()*indicesOfTimes.length)
      }
      stuAvailTimes[randIndex] = 1
      studentMap.set(studentList[0], stuAvailTimes)
      var course = {
          'course_num': s,
          'course': 'course',
          'teacher': "Pike",
          'time': maxTime,
        }
        var sched = studentSchedule.get(studentList[0])
        sched.push(course)
        
        studentSchedule.set(studentList[0], sched)
        studentList.shift()
    }
    //console.log(studentSchedule)
}
function unScheduleCourse(s){
  console.log("unScheduleCourse")
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
  var sched = studentSchedule.get(parseInt(req.params.id, 10))
  console.log(sched)
  console.log(req.params.id)
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
      res.render('studentSched', {'requests': requests, 'schedule': sched})

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
      'edit': true,
    } 
    if(!teacherMap.has(result.rows[i].teacher_id)) {
          var sched = [0,0,0,0,0,0,0]
          teacherMap.set(result.rows[i].teacher_id, sched);
    }
    if(times.includes(result.rows[i].time)) {
      var ind = times.indexOf(result.rows[i].time);
      teacherMap.get(result.rows[i].teacher_id)[ind]=1;
      console.log("Set to 1")
    }
    sectionlist.push(section)
    }
    //console.log(teacherMap);
    res.render('index', {'sectionlist': sectionlist, 'extra': 8})
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
            var sched = [0,0,0,0,0,0,0]
            studentMap.set(result.rows[i].student_id, sched);
            studentSchedule.set(result.rows[i].student_id, []);
          }
        }
      })
      .catch(e => console.log(e))
  })  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

