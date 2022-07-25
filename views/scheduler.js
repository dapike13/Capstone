
//Global Variables
var sectionlist =[]
var courseSections = new Map()
var courseID = []
var teacherMap = new Map();
var studentSchedule = new Map();
var times = ["A", "B", "C", "D", "E", "F", "G"]

var coursesToSched = []
var studentRequests = new Map();
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
    scheduleCourse(coursesToSchedule[i])
  }
  console.log(coursesToSchedule)
}
//Send current state to the server
function save(){
  console.log("SAVE")
  const objSM = Object.fromEntries(studentMap)
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
  console.log("SavePrompt")
   var check = confirm("Do you want to save before moving to next page?");
    if(check == true){
      save()
      if(btn =="students"){open("/students", "_self") }
        if(btn =="teachers"){open("/teachers", "_self") }

    }
    else{
      if(btn =="students") {open("/students", "_self")}
        if(btn =="teachers") {open("/teachers", "_self")}}
    }

function scheduleCourse(s){
  console.log("Course to sched:" + s)
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
  for(var i=0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].course_id == s) 
    {
      console.log(s)
      //Make a list of teachers teaching the course
      teacherID.push(sectionlist[i].teacherID) 
      teacherNames.push(sectionlist[i].teacher)
      course = sectionlist[i].name
    }
  }
  console.log("Num of Students")
  console.log(numberOfStudents)
  //Make a list of students requesting the course
  studentMap.forEach((value, key) => {
        if (value.requests.includes(s)) {
          studentList.push(key)
                  }
      })
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
    numberOfStudents[i]=0;
    var timesToNumStu = new Map()
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
    for(var q=0; q < sectionlist.length; q++)
    {
      if(sectionlist[q].course_id == s && sectionlist[q].sec_num == sectionNums[i])
      {
        sectionlist[q].time = maxTime
        sectionlist[q].edit = false
        document.getElementById(s+"text"+sectionNums[i]).innerHTML = maxTime
      }
    }
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
        studentMap.get(studentList[0]).sched = stuAvailTimes
        var course1 = {
          'course_num': s,
          'course': course,
          'secNum': sectionNums[randIndex],
          'teacher': teacherNames[randIndex],
          'time': times[indicesOfTimes[randIndex]],
          }
          studentMap.get(studentList[0]).sections[indicesOfTimes[randIndex]] = course1
        studentList.shift()
    }
  }
  console.log(numberOfStudents)
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
          }
        }
        
      }
    }
}






