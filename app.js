//git add .
//git commit -m "Comment"
//git push

const express = require('express')
const app = express()

const {Client} = require('pg')
const port = 3000

const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const session = require('express-session')
const flash = require('express-flash')
const passport = require('passport')
const initializePassport = require('./passportConfig')

initializePassport(passport);

//Look this up
app.use(express.urlencoded({extended:false}))
app.use(bodyParser.json())
app.set('view engine', 'pug')
app.use(express.static('views'));
//encrypt info in session
app.use(session({
  secret: "secretKey",
  resave: false,
  saveUninitialized: false
}))
app.use(passport.session())
app.use(passport.initialize())
app.use(flash())

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

var timeSlotMap = new Map();
var scheduleGrid = new Map();

const client = new Client({
  user: 'daniellebodine',
  host: 'localhost',
  database: 'school',
  password: 'secretpassword',
  port: 5432,
})

client.connect()

app.get('/users/register', checkAuthenticated, (req, res) => {
  res.render('register', {'err': []})
})

app.get('/users/login', checkAuthenticated, (req, res) => {
  res.render('login')
})

app.post('/users/register', async(req, res) => {
  let {name, email, password} = req.body;
  console.log({name, email, password})

  var errors = []
  if (!name || !email || !password){
    errors.push({message: "Please enter all fields"})
  }
  if(password.length < 6){
    errors.push({message: "Password is too short"})
  }
  if(errors.length > 0){
    res.render("register", {'err': errors})
  }
  else{
    let hashedPassword = await bcrypt.hash(password, 10)
    console.log(hashedPassword)

    client.query("SELECT * from users WHERE email = $1", [email], (error, result) =>{
      if(error){console.log(error)}
        console.log(result.rows)
      if(result.rows.length > 0){
        errors.push({message: "Already registered"})
        res.render("register", {'err': errors})
      }
      else{
        client.query("INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, password",[name, email, hashedPassword], (error, result) =>{
          if(error){console.log(error)}
            console.log(result.rows)
            req.flash('success_msg', "You are now registered. Please Login")
            res.redirect('/users/login')
         })
        }
      })

  }
})
app.post("/users/login", passport.authenticate('local', {
  successRedirect: "/index",
  failureRedirect: "/users/login",
  failureFlash: true
}))

app.get("/index", (req, res) =>{
  res.render("index", {'err': [], 'gridlist': []})
})

app.get('/users/logout', (req, res) => {
  req.logOut((err) =>{
    if(err){return next(err)} 
  })
  req.flash("success_msg", "You have logged out")
  res.redirect('/users/login')
})

function checkAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return res.redirect("/index", {'err': [], 'gridlist': []})
  }
  next();
}

function checkNotAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next()
  }
  res.redirect("/users/login")
}

app.post('/times', (req, res) => {
  let {timeSlotName, timeSlots} = req.body;
  console.log({timeSlotName, timeSlots})
  var errors = []
  if(timeSlotMap.has(timeSlotName)){
    errors.push({message: "Name already taken"})
  }
  else{
    var returned = checkTimes(timeSlots)
    
    if(returned.worked)
    {
      timeSlotMap.set(timeSlotName, returned.list)
    }
    else{
      for(var i =0; i < returnedList.length;i++){
        errors.push(returnedlist[i])
      }
    }
  }
  res.render("index", {'err': errors, 'gridlist': []})
  console.log(timeSlotMap)
})

app.post('/addSchedule', (req, res) => {
  let {day1, day2, day3, day4, day5, day6} = req.body
  var days = {day1, day2, day3, day4, day5, day6}
  console.log(days)
  var maxLength = 0
  var errors = []
  var j =1
  for(const d in days)
  {
    console.log(days[d])
    var returned = checkTimes(days[d])
    if(returned.worked)
    {
      console.log(returned.list)
      scheduleGrid.set(j, returned.list)
      if(returned.list.length > maxLength){maxLength = returned.list.length}

    }
    else{
      for(var i =0; i < returned.list.length;i++){
        errors.push(returned.list[i])
      }
    }
    j++
  }
  console.log(errors)
  console.log(scheduleGrid)
  var grid = []
  for(var j =0; j< maxLength; j++){
    grid.push([])
  }
  scheduleGrid.forEach((value, key) =>{
    for(var j=0; j < maxLength; j++){
      console.log(value[j])
      if(j< value.length){
        grid[j].push(value[j])
      }
      else{
        grid[j].push(" ")
      }
    }
  })
  console.log(grid)
  res.render("index", {'err': errors, 'gridlist': grid})
  //Display Grid 
  //Each time submit again, overwrites previous
})

function checkTimes(inputStr){
  var errors = []
  var endLoop = false
  const timesList = inputStr.split(",")
  for(var i =0; i<timesList.length && !endLoop;i++){
    timesList[i]=timesList[i].trim()
    if(timesList[i].length % 2 ==1){
      errors.push({message: "Enter time in correct format"})
      break
    }
    var countInString =0;
    for(var j=0; j<timesList[i].length-1;j+=2){
      const pattern = /[a-z][0-9]/i
      var check = pattern.test(timesList[i].substring(j, j+2))
      if(!check){
        console.log("Incorrect: " + timesList[i].substring(j, j+2))
        errors.push({message: "Enter time in correct format"})
        endLoop = true
        break
      }
      else{
        console.log("Correct: " +timesList[i].substring(j, j+2))
      }
    }
  }
  if(errors.length > 0){
    return {
      worked: false,
      list: errors}
    }
    else{
      return {
        worked: true,
        list: timesList}
      }
}

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
  //console.log("From client "+ req.body.studentSched)
  //console.log("Section from client "+req.body.sections )
  studentMap = new Map(Object.entries(req.body.studentSched))
  sectionlist = req.body.sections
  //Could modify so only update ones that have been changed...
  //console.log(studentMap)
  //console.log(sectionlist)
  for(var i =0; i < sectionlist.length; i++)
  {
    client
      .query("UPDATE sections SET time = $1, num_students = $2 WHERE course_id = $3 and sec_number = $4", [sectionlist[i].time, sectionlist[i].numStud, sectionlist[i].course_id, sectionlist[i].sec_num])
      .catch(e => console.log(e))
  }
  
  studentMap.forEach((value, key) => {
    var id = key
    var sched = value.sections
    for(var k =0; k < sched.length; k++)
    {
      if(sched[k]!=null){
        client
          .query("INSERT INTO student_schedule VALUES ($1, $2, $3)", [sched[k].course_id, sched[k].sec_num, id])
          .catch(e => console.log(e))
      }
    }
  })
  
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

//checkNotAuthenticated
app.get('/', (req, res) => {
  res.render('index', {'err': [], 'gridlist': []})
  })  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

