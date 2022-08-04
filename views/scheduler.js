
//Global Variables
var sectionlist =[]
var courseSections = new Map()
var courseID = []
var teacherMap = new Map();
var studentSchedule = new Map();
var times = ["A", "B", "C", "D", "E", "F", "G"]

var coursesToSched = []
var studentRequests = new Map();
var courseRequests = new Map();
var studentMap = new Map();
var hasSaved = false;


//Receive Section Data
function receiveSections(){
  fetch("/scheduler", {
    method: "POST",})
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    sectionlist = data.sections
    teacherMap = new Map(Object.entries(data.teacherMap))
    studentMap = new Map(Object.entries(data.studentMap))
    courseRequests = new Map(Object.entries(data.courseRequests))
    console.log(courseRequests)
    for(var i =0; i < sectionlist.length; i++)
    {
      if(!courseID.includes(sectionlist[i].course_id))
        {
          courseSections.set(sectionlist[i].course_id, [sectionlist[i].sec_num])
          courseID.push(sectionlist[i].course_id)
        }
      else{
          var x = courseSections.get(sectionlist[i].course_id)
          x.push(sectionlist[i].sec_num)
          courseSections.set(sectionlist[i].course_id, x)
        }
    }
    for(var i =0; i < courseID.length; i++)
    {
      var x = document.getElementById(courseID[i]+"check")
      x.hidden= false
      var k = courseSections.get(courseID[i])
      for(var j =0; j < k.length; j++){
        var y = document.getElementById(courseID[i]+"edit"+k[j])
        y.hidden= false
      }
    }
  })
 .catch(function(error){
    console.log(error)
  })
}

window.onbeforeunload = function(){
  return 'Are you sure you want to leave?';
};

function scheduleCourses(){
  hasSaved = false;
  var coursesToSchedule = []
  for(var i =0; i < courseID.length; i++)
    {
      var x = document.getElementById(courseID[i]+"check")
      if(x.checked){coursesToSchedule.push(courseID[i])}
    }
  for(var i =0; i < coursesToSchedule.length; i++)
  {
    scheduleCourse(coursesToSchedule[i], [])
  }
  console.log(coursesToSchedule)
}
//Send current state to the server
function save(){
  console.log("SAVE")
  const objSM = Object.fromEntries(studentMap)
  console.log(sectionlist)
  fetch("/save", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({sections: sectionlist, studentSched: objSM}),
  })
  .catch(function(error){
    console.log(error)
  })
}

//Show prompt before navigating to another page to save work and push to database
function savePrompt(btn){
   var check = confirm("Do you want to save before moving to next page?");
    if(check == true){
      save()
      if(btn =="students"){open("/students", "_self") }
        if(btn =="teachers"){open("/teachers", "_self") }
          if(btn =="data"){open("/data", "_self")}

    }
    else{
      if(btn =="students") {open("/students", "_self")}
        if(btn =="teachers") {open("/teachers", "_self")}}
          if(btn =="data"){open("/data", "_self")}
    var sectionListSave = JSON.stringify(sectionlist)
    localStorage.setItem("SecList", sectionListSave)
    }

function scheduleCourse(s, t){
  var sectionNums = courseSections.get(s)
  var teacherID = []
  var teacherNames = []
  var studentList = [];  //List of students signed up for the course
  var numStu = 0
  var numStuAvail = []
  var course;
  var teacher;
  var indicesOfTimes = []
  var numberOfStudents = []
  var listOfSections = []
  for(var i =0; i < sectionNums.length; i++){
    numberOfStudents[i]=0;
  }
  for(var i=0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].course_id == s) 
    {
      //Make a list of teachers teaching the course
      teacherID.push(sectionlist[i].teacherID) 
      teacherNames.push(sectionlist[i].teacher)
      course = sectionlist[i].name
      listOfSections.push(sectionlist[i])
    }
  }
  //Make a list of students requesting the course
  studentMap.forEach((value, key) => {
        if (value.requests.includes(s)) {
          studentList.push(key)
                  }
      })

  if(t.length==0){
    //Count how many students are free during a class
    for(var i =0; i < times.length; i++)
    {
      numStu = 0
      for(var k = 0 ; k<studentList.length; k++)
      {
        var stuAvailTimes = studentMap.get(studentList[k]).sched
        if(stuAvailTimes[i]==0){numStu++;}
      }
      numStuAvail.push(numStu)
    }
    //For each teacher teaching the course...
    for(var i = 0; i<teacherID.length;i++)
    {
      
      var timesToNumStu = new Map()
      numberOfStudents[i]=0;
      //Get the times the teacher is currently available
      var availTimes = teacherMap.get(teacherID[i].toString()).sched
      //Checks which time has the most students available
      var max = 0;
      var maxTime;
      var index =0
      for(var j =0; j < availTimes.length;j++)
      {
        if(availTimes[j] == 0)
        {
          var numStudents = numStuAvail[j]
          if(numStudents > max)
          {
            max = numStudents
            maxTime = times[j]
            index = j
          }
        }
      }
      indicesOfTimes.push(index)
      //Schedules Teacher, updates Teacher Map
      availTimes[index] = 1
      teacherMap.get(teacherID[i].toString()).sched = availTimes
      //Update list of sections for the teacher???

      for(var q=0; q < sectionlist.length; q++)
      {
        if(sectionlist[q].course_id == s && sectionlist[q].sec_num == sectionNums[i])
        {
          sectionlist[q].time = maxTime
          sectionlist[q].edit = false
          //document.getElementById(s+"text"+sectionNums[i]).innerHTML = maxTime
          }
      }
  }
}
  else{
    indicesOfTimes = t
  }
//Schedule Students
    while(studentList.length!=0)
    {
      var randIndex = Math.floor(Math.random()*indicesOfTimes.length)
      var stuAvailTimes = studentMap.get(studentList[0]).sched
      var count =0;
      for(var i=0; i < indicesOfTimes.length;i++)
      {
        if(stuAvailTimes[indicesOfTimes[i]]==1){count++}
      }
      if(count == indicesOfTimes.length) {console.log("Student has a conflict")}
      else{
        while(stuAvailTimes[indicesOfTimes[randIndex]] != 0)
        {
          randIndex = Math.floor(Math.random()*indicesOfTimes.length)
        }
        stuAvailTimes[indicesOfTimes[randIndex]] = 1
        numberOfStudents[randIndex]++
        console.log("Inside student schedule" +numberOfStudents)
        studentMap.get(studentList[0]).sched = stuAvailTimes
        studentMap.get(studentList[0]).sections[indicesOfTimes[randIndex]] = listOfSections[sectionNums[randIndex]-1]
        studentList.shift()
    }
  }
  console.log("sectionNums"+sectionNums)
  for(var q=0; q < sectionlist.length; q++)
    {
      if(sectionlist[q].course_id == s)
      {
        for(var i =0; i < sectionNums.length; i++)
        {
          if(sectionlist[q].sec_num == sectionNums[i])
          {
            sectionlist[q].numStud = numberOfStudents[i]
            document.getElementById(s+"num"+sectionNums[i]).innerHTML = numberOfStudents[i]
            document.getElementById(s+"text"+sectionNums[i]).innerHTML = sectionlist[q].time
          }
        }
        
      }
    }
}

//Unschedule Courses
function unscheduleCourse(c, s){
  //Find course in the sectionlist
  //Unschedule the Teacher
  for(var i=0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].course_id == c && s == 0) 
    {
        currTime = sectionlist[i].time
        index = times.indexOf(currTime)
        console.log(index)
        //Clear Time
        sectionlist[i].time = ''
        tID = sectionlist[i].teacherID
        availTimes = teacherMap.get(tID.toString()).sched
        availTimes[index] = 0
        sectionlist[i].numStud = 0
        document.getElementById(c+"num"+sectionlist[i].sec_num).innerHTML = 0
        document.getElementById(c+"text"+sectionlist[i].sec_num).innerHTML = ''
    }
    if(sectionlist[i].course_id == c && sectionlist[i].sec_num == s) 
    {
        currTime = sectionlist[i].time
        index = times.indexOf(currTime)
        //Clear Time
        sectionlist[i].time = ''
        tID = sectionlist[i].teacherID
        availTimes = teacherMap.get(tID.toString()).sched
        availTimes[index] = 0
        sectionlist[i].numStud = 0
        document.getElementById(c+"num"+sectionlist[i].sec_num).innerHTML = 0
        document.getElementById(c+"text"+sectionlist[i].sec_num).innerHTML = ''
    }

  }
  var students = courseRequests.get(c.toString())
  for(var i =0; i < students.length;i++)
  {
    stuSections = studentMap.get(students[i].toString()).sections
    stuSched = studentMap.get(students[i].toString()).sched
    stuSections.forEach((item, index) => {
      if(item!=null){
        if(item.course_id == s){
          stuSched[index] = 0
          item = undefined
        }
      }
    })
  }
}

function scheduleCourseSection(c, s, t){
  var indexCourseTimes = []
  indexCourseTimes[s-1] = times.indexOf(t)

  for(var i =0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].course_id == c && sectionlist[i].sec_num != s) {
      var sec = sectionlist[i].sec_num;
      var time = sectionlist[i].time;
      indexCourseTimes[sec-1]= times.indexOf(time)
      console.log(c+"text"+sectionlist[i].sec_num)
      document.getElementById(c+"text"+sectionlist[i].sec_num).innerHTML = time
    }
  }
  unscheduleCourse(c, s)
  
  for(var i=0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].course_id == c && sectionlist[i].sec_num == s) 
    {
        //listOfSections[s-1]= sectionlist[i]
        newIndex = times.indexOf(t)
        //Clear Time
        sectionlist[i].time = t
        tID = sectionlist[i].teacherID
        availTimes = teacherMap.get(tID.toString()).sched
        //Check if teacher is available, if not ask to Pick a new time (Need an HTML element for this)
        if(availTimes[newIndex] == 1){console.log("Pick a new time")}
          else{availTimes[newIndex] = 1}
            console.log("New time: "+ t)
        document.getElementById(c+"text"+s).innerHTML = t
        break
    }
  }
  scheduleCourse(parseInt(c), indexCourseTimes)
}

function unscheduleCourses(){
  var coursesToUnschedule = []
  for(var i =0; i < courseID.length; i++)
    {
      var x = document.getElementById(courseID[i]+"check")
      if(x.checked){coursesToUnschedule.push(courseID[i])}
    }
  for(var i =0; i < coursesToUnschedule.length; i++)
  {
    unscheduleCourse(coursesToUnschedule[i], 0)
  }
  console.log(coursesToUnschedule)
}

//hide edit button
//Show text box & Update button
function edit(c, s){
  var editBtn = document.getElementById(c+"edit"+s)
  editBtn.hidden = true
  var textTime = document.getElementById(c+"text"+s)
  textTime.hidden = true
  var updateBtn = document.getElementById(c+"update"+s)
  updateBtn.hidden = false
  var labelTime = document.getElementById(c+"label"+s)
  labelTime.hidden = false
}

//hide text box & Update button
//Show edit button
//Unschedule teacher & students
//Rescheudle teacher & students 
function update(c, s){
  var labelTime = document.getElementById(c+"label"+s)
  var time = labelTime.value
  if(!times.includes(time)){
    var check = confirm("Please enter a valid time and click Update again");
  }
  else{
    var editBtn = document.getElementById(c+"edit"+s)
    editBtn.hidden = false
    var textTime = document.getElementById(c+"text"+s)
    textTime.hidden = false
    var updateBtn = document.getElementById(c+"update"+s)
    updateBtn.hidden = true
    labelTime.hidden = true
    scheduleCourseSection(c, s,time)
  }
}

function makeHeatMap(){
  sectionlist = JSON.parse(localStorage.getItem("SecList"))
  console.log(sectionlist)
  var grade;

  var listOfSections =[]
  if(document.getElementById('9').checked){
    grade = 9
  }
  else if(document.getElementById('10').checked){
    grade = 10
  }
  else if(document.getElementById('11').checked){
    grade = 11
  }
  else if(document.getElementById('12').checked){
    grade = 12
  }
  else
  {
    console.log("Please select a grade")
  }
  console.log(grade)
  var scheduleCounts = []
  for(var i =0; i < 4; i++)
  {
    scheduleCounts[i]=[]
  }
  for(var i =0; i < 4; i++)
  {
    for(var j=0; j <4; j++)
    {
      scheduleCounts[i][j] =0;
    }
  }
  console.log(sectionlist.length)
  for(var i =0; i < sectionlist.length; i++)
  {
    console.log("Grade" + sectionlist[i].grade)
    if(sectionlist[i].grade == grade.toString())
    {
      console.log("Grade worked")
      listOfSections.push(sectionlist[i]);
      if(sectionlist[i].time == "A")
      {
        console.log("Found one")
        scheduleCounts[0][0]++
        scheduleCounts[0][2]++
      }
    }
  }
  for(var i=0; i < 4; i++)
  {
    for(var j =0; j<4; j++)
    {
      if(scheduleCounts[i][j] > 10){
        document.getElementById('A1').style.backgroundColor = 'red'
      }
      else if(scheduleCounts[i][j] > 5){
        document.getElementById('A1').style.backgroundColor = 'yellow'
      }
      else if (scheduleCounts[i][j] > 1){
        document.getElementById('A1').style.backgroundColor = 'green'
      }
    }
  }
  console.log(scheduleCounts)

}

  


