
//Global Variables
var sectionlist =[]
var courseSections = new Map()
var courseID = []
var teacherMap = new Map();
var studentSchedule = new Map();
var times = []
var coursesToSched = []
var studentRequests = new Map();
var courseRequests = new Map();
var studentMap = new Map();
var timeSlotMap = new Map();
var hasSaved = false;
var timeIndexMap = new Map();


//Receive Section Data
function receiveSections(){
  fetch("/scheduler", {
    method: "POST",})
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    sectionlist = data.sections
    times = data.timesList
    teacherMap = new Map(Object.entries(data.teacherMap))
    studentMap = new Map(Object.entries(data.studentMap))
    courseRequests = new Map(Object.entries(data.courseRequests))
    timeIndexMap = new Map(Object.entries(data.timeIndex))
    timeSlotMap = new Map(Object.entries(data.timeSlot))
    console.log(timeSlotMap)    
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

function scheduleAll(){
  for(var i =0; i < sectionlist.length; i++){
    //scheduleCourse(sectionlist[i].course_id, [])
  }
}
//Get the coordinates of the time in the matrix
function getCoords(t){
  var len = t.length
  listCoords = []
  for(var i=0; i < len; i+=2)
  {
    var coord = timeIndexMap.get(t.substring(i, i+2))
    listCoords.push(coord)
  }
  return listCoords
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
    scheduleCourse(coursesToSchedule[i], [])
  }
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
  //.then((response) => response.json())
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
          console.log(value)
          studentList.push(key)
                  }
      })
  console.log(studentList)
  console.log("len"+ studentList.length)

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
      console.log("Student List While Loop")
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
        stuSections = studentMap.get(studentList[0]).sections
        stuSections[indicesOfTimes[randIndex]] = listOfSections[sectionNums[randIndex]-1]
        
        studentMap.get(studentList[0]).sched = stuAvailTimes
        studentMap.get(studentList[0]).sections[indicesOfTimes[randIndex]] = listOfSections[sectionNums[randIndex]-1]
        //console.log(studentMap.get(studentList[0]).sections[indicesOfTimes[randIndex]])
        studentList.shift()
    }
  }
  console.log(studentMap)
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
        //Clear Time
        sectionlist[i].time = ''
        tID = sectionlist[i].teacherID
        availTimes = teacherMap.get(tID.toString()).sched
        availTimes[index] = 0
        sectionlist[i].numStud = 0
        teacherMap.get(tID.toString()).sched = availTimes
        
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
        teacherMap.get(tID.toString()).sched = availTimes
        //teacherMap.set(tID.toString()).sched = availTimes
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
        if(item.course_id == c){
          stuSched[index] = 0
          item = undefined
        }
      }
    })
    studentMap.get(students[i].toString()).sections = stuSections
    studentMap.get(students[i].toString()).sched = stuSched
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
      document.getElementById(c+"text"+sectionlist[i].sec_num).innerHTML = time
    }
  }
  unscheduleCourse(c, s)
  
  for(var i=0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].course_id == c && sectionlist[i].sec_num == s) 
    {
        newIndex = times.indexOf(t)
        //Clear Time
        sectionlist[i].time = t
        tID = sectionlist[i].teacherID
        availTimes = teacherMap.get(tID.toString()).sched
        //Check if teacher is available, if not ask to Pick a new time (Need an HTML element for this)
        availTimes[newIndex] = 1
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
  console.log(c)
  console.log(s)
  var labelTime = document.getElementById(c+"label"+s)
  var time = labelTime.value
  if(!times.includes(time)){
    document.getElementById(c+"error"+s).innerHTML = "Invalid Time"
    document.getElementById(c+"error"+s).hidden = false
    //var check = confirm("Please enter a valid time and click Update again");
  }
  else{
    for(var i=0; i < sectionlist.length; i++)
      {
      if(sectionlist[i].course_id == c && sectionlist[i].sec_num == s) 
        {
          console.log(sectionlist[i].time)
          console.log(time)
          if(sectionlist[i].time != time){
            newIndex = times.indexOf(time)
            tID = sectionlist[i].teacherID
            availTimes = teacherMap.get(tID.toString()).sched
            //Check if teacher is available, if not ask to Pick a new time (Need an HTML element for this)
            if(availTimes[newIndex] == 1){
            document.getElementById(c+"error"+s).innerHTML = "Teacher is not free"
            document.getElementById(c+"error"+s).hidden = false
          }
          else{
            var editBtn = document.getElementById(c+"edit"+s)
            editBtn.hidden = false
            var textTime = document.getElementById(c+"text"+s)
            textTime.hidden = false
            var updateBtn = document.getElementById(c+"update"+s)
            updateBtn.hidden = true
            labelTime.hidden = true
            document.getElementById(c+"error"+s).hidden = true
            scheduleCourseSection(c, s,time)

          }
        }
          else{
            var editBtn = document.getElementById(c+"edit"+s)
            editBtn.hidden = false
            var textTime = document.getElementById(c+"text"+s)
            textTime.hidden = false
            var updateBtn = document.getElementById(c+"update"+s)
            updateBtn.hidden = true
            labelTime.hidden = true
            document.getElementById(c+"error"+s).hidden = true
          }
        }
      }
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
  for(var i =0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].grade == grade.toString())
    {
      listOfSections.push(sectionlist[i]);
      if(sectionlist[i].time == "A")
      {
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
  addTableRows(listOfSections)

}

function addTableRows(sections){
  console.log(sections)
  var table = document.getElementById("mapSections")
  var len = document.getElementById("mapSections").rows.length
  console.log("Length" + len)
  for(var j =1; j < len; j++)
  {
    table.deleteRow(1)
  }

  for(var i =0; i < sections.length; i++)
  {
    var row = table.insertRow(i+1)
    var cell1 = row.insertCell(0)
    cell1.innerHTML = sections[i].course_id

    var cell2 = row.insertCell(1)
    cell2.innerHTML = sections[i].name

    var cell3 = row.insertCell(2)
    cell3.innerHTML = sections[i].sec_num

    var cell4 = row.insertCell(3)
    cell4.innerHTML = sections[i].teacherID

    var cell5 = row.insertCell(4)
    cell5.innerHTML = sections[i].teacher

    var cell6 = row.insertCell(5)
    cell6.innerHTML = sections[i].time

    var cell7 = row.insertCell(6)
    cell7.innerHTML = sections[i].numStud

    var cell8 = row.insertCell(7)
    cell8.innerHTML = 0
  }
  


}

  
