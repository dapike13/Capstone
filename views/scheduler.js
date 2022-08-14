
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
var sectionMap = new Map()
var conflicts = new Map()


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
    sectionMap = new Map(Object.entries(data.sectionMap))
    
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

function scheduleCourse(c){
  var sectionNums = courseSections.get(c) //Might not need this, use sectionMap???
  var teacherID = []
  var teacherNames = []
  var studentList = courseRequests.get(c.toString())
  var numStu = 0
  var studentAvail = new Map()
  var course;
  var teacherAvail = new Map()
  var possibleTimes = new Map()
  var teacher;
  var indicesOfTimes = []
  var numberOfStudents = []
  var listOfSections = sectionMap.get(c.toString())
  var timeSlot = listOfSections[0].timeSlot
  var listOfTimes = timeSlotMap.get(timeSlot)
  var maxClassSize = Math.ceil(studentList.length/listOfSections.length)

  //Get list of teachers
  for(var i=0; i < listOfSections.length;i++){
      teacherID.push(listOfSections[i].teacherID) 
      teacherNames.push(listOfSections[i].teacher)
      course = listOfSections[i].name
  }
  //Set Up teacherAvailMap
  for(var i = 0; i<teacherID.length;i++){
      //Get the times the teacher is currently available
      var availTimes = teacherMap.get(teacherID[i].toString()).sched
      var data ={
        'avail':availTimes,
        'count':0,
        'timeWorks':true
      }
      teacherAvail.set(teacherID[i], data)
    } 

  var items = makeStuAvailMap(c, listOfTimes)

  studentAvail = items.studentAvail
  var listOfTotalStudents = items.totalStudents
    for(var i=0; i < listOfTimes.length; i++){
      var currTime = listOfTimes[i]
      var count = new Array(teacherID.length).fill(0)
      var totalStudents = 0;
      teacherAvail.forEach((value, key) =>{
          
          var list = value.avail
        
          var free = checkFree(list, currTime)
          if(free){
            if(possibleTimes.has(currTime)){
                possibleTimes.get(currTime).tList.push(key)
                var index = listOfTimes.indexOf(currTime)
                possibleTimes.get(currTime).numStud = listOfTotalStudents[index]
              }
              else{
                var timeData ={
                  'tList':[key],
                  'numStud':totalStudents
                }
                possibleTimes.set(currTime, timeData)
              }
          }
        })
    }        
    //Find the Maximum Time in Possible Times
    var usedTimes = []
    for(var i =0; i< listOfSections.length; i++){
      var max = 0
      var backup;
      var teacher = listOfSections[i].teacherID
      var possTime;
      possibleTimes.forEach((value, key) =>{
        if(value.tList.includes(teacher) && value.numStud > max){
          if(!usedTimes.includes(key)){
            max = value.numStud
            possTime = key
            
          }
          else{
            backup = key
          }
        }
      })
      if(possTime == undefined){
        possTime = backup
      }
     
      var ind = possibleTimes.get(possTime).tList.indexOf(teacher)
      possibleTimes.get(possTime).tList.splice(ind, 1)
      usedTimes.push(possTime)
      //Update HTML
      
      scheduleSection(c, listOfSections[i].sec_num, possTime)
    }

  var s = studentAvail.size
  scheduleStudents(c, studentAvail)
  sectionlist = []
  sectionMap.forEach((value, key) =>{
      sectionlist = sectionlist.concat(value)
    })
  updateCourseHTML(c)
}


//Unschedule Courses
function unscheduleCourse(c, s){
  //Find course in the sectionlist
  //Unschedule the Teacher
  var listOfSections = sectionMap.get(c.toString())
  for(var i=0; i < listOfSections.length; i++)
  {
    var oldTime = listOfSections[i].time
    if(s==0){
        tID = listOfSections[i].teacherID
        availTimes = teacherMap.get(tID.toString()).sched
        for(var j =0; j < oldTime.length-1; j+=2){
          var check = oldTime.substring(j, j+2)
          var ind = timeIndexMap.get(check)
          availTimes[ind.x][ind.y] = 0}
        listOfSections[i].time = ''
        listOfSections[i].numStud =0
        listOfSections[i].students = []
        teacherMap.get(tID.toString()).sched = availTimes
        document.getElementById(c+"num"+listOfSections[i].sec_num).innerHTML = 0
        document.getElementById(c+"text"+listOfSections[i].sec_num).innerHTML = ''
    }
    else if(listOfSections[i].sec_num !=s){
      listOfSections[i].numStud =0
      listOfSections[i].students = []
      document.getElementById(c+"num"+listOfSections[i].sec_num).innerHTML = 0
    }
    if(listOfSections[i].sec_num == s) 
    {
        tID = listOfSections[i].teacherID
        availTimes = teacherMap.get(tID.toString()).sched
        for(var j =0; j < oldTime.length-1; j+=2){
          var check = oldTime.substring(j, j+2)
          var ind = timeIndexMap.get(check)
          availTimes[ind.x][ind.y] = 0}
        listOfSections[i].time = ''
        listOfSections[i].numStud =0
        listOfSections[i].students = []
        teacherMap.get(tID.toString()).sched = availTimes
        document.getElementById(c+"num"+listOfSections[i].sec_num).innerHTML = 0
        document.getElementById(c+"text"+listOfSections[i].sec_num).innerHTML = ''   
    }
    var students = listOfSections[i].students
    for(var k=0; k < students.length; k++)
    {
      var stuSched = studentMap.get(students[k].toString()).sched
      for(var j =0; j < oldTime.length-1; j+=2){
        var check = oldTime.substring(j, j+2)
        var ind = timeIndexMap.get(check)
        stuSched[ind.x][ind.y] = 0}
        studentMap.get(students[k].toString()).sched = stuSched
  }
  listOfSections[i].students = []
    }
}

function scheduleCourseSection(c, s, t){
  unscheduleCourse(c, s)
  document.getElementById(c+"text"+s).innerHTML = t
  var sections = sectionMap.get(c)
  var courseTimes = []
  courseTimes[s-1] = t
  var ready = true
  for(var i =0 ; i < sections.length; i++){
    if(sections[i].sec_num!=s){
      courseTimes[i]=sections[i].time
      if(sections[i].time == ''){
        ready = false
      }
    }
    else{
      sections[i].time = t
      var tID = sections[i].teacherID
    }
  }
  if(!ready){
    //Schedule teacher
    var avail = teacherMap.get(tID.toString()).sched
    for(var j =0; j < t.length-1; j+=2){
        var check = t.substring(j, j+2)
        var ind = timeIndexMap.get(check)
        avail[ind.x][ind.y] = 1}
    teacherMap.get(tID.toString()).sched = avail
    document.getElementById(c+"error"+s).innerHTML = "Enter all times to schedule"
    document.getElementById(c+"error"+s).hidden = false
  }
  else{
    document.getElementById(c+"error"+s).hidden = true
    document.getElementById(c+"text"+s).innerHTML = t
    //Schedule New Time
    var avail = teacherMap.get(tID.toString()).sched
    for(var j =0; j < t.length-1; j+=2){
        var check = t.substring(j, j+2)
        var ind = timeIndexMap.get(check)
        avail[ind.x][ind.y] = 1}
    teacherMap.get(tID.toString()).sched = avail
    
    scheduleCourse(parseInt(c), courseTimes)
  }
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
  var cancelBtn = document.getElementById(c+"cancel"+s)
  cancelBtn.hidden = false
  var currSections = sectionMap.get(c)
  for(var i =0; i < currSections.length; i++){
    if(currSections[i].sec_num ==s){
      var currTime = currSections[i].time
    }
  }
  var labelTime = document.getElementById(c+"label"+s)
  console.log(currTime)
  labelTime.innerHTML = currTime
  labelTime.hidden = false
}

function cancel(c, s){
  var editBtn = document.getElementById(c+"edit"+s)
  editBtn.hidden = false
  var textTime = document.getElementById(c+"text"+s)
  textTime.hidden = false
  var updateBtn = document.getElementById(c+"update"+s)
  updateBtn.hidden = true
  var labelTime = document.getElementById(c+"label"+s)
  labelTime.hidden = true
  document.getElementById(c+"error"+s).hidden = true
  var cancelBtn = document.getElementById(c+"cancel"+s)
  cancelBtn.hidden = true
}

//hide text box & Update button
//Show edit button
//Unschedule teacher & students
//Rescheudle teacher & students 
function update(c, s){
  var labelTime = document.getElementById(c+"label"+s)
  var time = labelTime.value
  var section = sectionMap.get(c)
  for(var i=0; i < section.length; i++){
    if(section[i].sec_num == s){
      var timeSlot = section[i].timeSlot
      var currTime = section[i].time
      var tID = section[i].teacherID
    }
  }
  var timeList = timeSlotMap.get(timeSlot)
  if(!timeList.includes(time)){
    document.getElementById(c+"error"+s).innerHTML = "Invalid Time"
    document.getElementById(c+"error"+s).hidden = false
  }
  else{
    console.log("New Time: " + time)
    if(currTime != time){
      var availTimes = teacherMap.get(tID.toString()).sched
      var free = checkFree(availTimes, time)
      if(free){
        var editBtn = document.getElementById(c+"edit"+s)
        editBtn.hidden = false
        var textTime = document.getElementById(c+"text"+s)
        textTime.hidden = false
        textTime.innerHTML = time
        var updateBtn = document.getElementById(c+"update"+s)
        updateBtn.hidden = true
        labelTime.hidden = true
        var cancelBtn = document.getElementById(c+"cancel"+s)
        cancelBtn.hidden = true
        document.getElementById(c+"error"+s).hidden = true
        unscheduleStudents(c)
        unscheduleSection(c, s)
        console.log("StudentMap")
        console.log(studentMap)

        scheduleSection(c, s, time)
        var sections = sectionMap.get(c.toString())
        var timeSlot = sections[0].timeSlot
        var timeSlotList = timeSlotMap.get(timeSlot)
        var items = makeStuAvailMap(c, timeSlotList)

        scheduleStudents(c, items.studentAvail)
        updateCourseHTML(c)
        console.log(sectionMap)
        
        }
      else{
        console.log("Teacher Not Free")
        document.getElementById(c+"error"+s).innerHTML = "Teacher is not free"
        document.getElementById(c+"error"+s).hidden = false
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


//Updates time in SectionMap, HTML
//Updates teacher matrix
function scheduleSection(c, s, t){
  var secs = sectionMap.get(c.toString())
  for(var i =0; i < secs.length; i++){
    if(secs[i].sec_num ==s){
      secs[i].time = t
      var tID = secs[i].teacherID
    }
  }
  
  var listOfCoords = checkTime(t)
  var avail = teacherMap.get(tID.toString()).sched
  for(var j =0; j < listOfCoords.length; j++){
    var x = listOfCoords[j].x
    var y = listOfCoords[j].y
    avail[x][y]=1
  }
  teacherMap.get(tID.toString()).sched = avail
  updateSectionHTML(c, s)
}

//Gets the coordinates of the time
function checkTime(time){
  var listOfCoords = []
  for(var j =0; j < time.length-1; j+=2){
    var check = time.substring(j, j+2)
    var ind = timeIndexMap.get(check)
    listOfCoords.push(ind)
  }
  return listOfCoords
}

//Remove time, numStudent, studentlist
//Update teacher matrix
function unscheduleSection(c, s){
  var secs = sectionMap.get(c)
  for(var i =0; i < secs.length; i++){
    if(secs[i].sec_num ==s){
      var currTime = secs[i].time
      secs[i].time = ''
      secs[i].numStud = 0
      var tID = secs[i].teacherID
    }
  }
  
  var listOfCoords = checkTime(currTime)
  var avail = teacherMap.get(tID.toString()).sched
  for(var j =0; j < listOfCoords.length; j++){
    var x = listOfCoords[j].x
    var y = listOfCoords[j].y
    avail[x][y]=0
  }
  teacherMap.get(tID.toString()).sched = avail
}

function unscheduleStudents(c){
  var secs = sectionMap.get(c)
  for(var i=0; i < secs.length; i++){
    var time = secs[i].time
    var students = secs[i].students
    console.log("students")
    console.log(students)
    for(var j =0; j <students.length; j++){
      var stuSched = studentMap.get(students[j].toString()).sched
      var listOfCoords = checkTime(time)
      console.log(listOfCoords)
      for(var k =0; k < listOfCoords.length; k++){
        var x = listOfCoords[k].x
        var y = listOfCoords[k].y
        stuSched[x][y]=0
      }
      studentMap.get(students[j].toString()).sched = stuSched
    }
    secs[i].students = []
    secs[i].numStud = 0
  }
}


//unschedule entire course
//update teacher matrix
function unscheduleCourse(c) {
  var secs = sectionMap.get(c)
  for(var i =0; i < secs.length; i++){
    unscheduleSection(c, i+1)
  }

}

function makeStuAvailMap(c, timeSlotList){
  var studentList = courseRequests.get(c.toString())
  var studentAvail = new Map()
  var totalStudents = new Array(timeSlotList.length).fill(0)
  for(var i =0; i < studentList.length; i++){
    var availTimes = studentMap.get(studentList[i].toString()).sched
    var data ={
      'avail': availTimes,
      'count': 0, 
      'listTimes':[]
    }
    studentAvail.set(studentList[i], data)
  }
  for(var j =0; j< timeSlotList.length; j++){
    var currTime = timeSlotList[j]
    var listOfCoords = checkTime(currTime)
    studentAvail.forEach((value, key) => {
      value.count = 0
      var list = value.avail
      for(var k =0; k < listOfCoords.length; k++){
        var x = listOfCoords[k].x
        var y = listOfCoords[k].y
        if(list[x][y] ==0) {value.count++}
        if(value.count == listOfCoords.length){
            value.listTimes.push(currTime)
            totalStudents[j]++
            }
          }
      })
  }
  return {studentAvail, totalStudents}
}

function scheduleStudents(c, stuAvailMap){
  var listOfSections = sectionMap.get(c.toString())
  var maxClassSize = Math.ceil(stuAvailMap.size/listOfSections.length)

  stuAvailMap.forEach((value, key) =>{
    var conflict = true
    for(var i =0; i < listOfSections.length; i++){
      if(value.listTimes.includes(listOfSections[i].time) && listOfSections[i].numStud < maxClassSize){
        var possTime = listOfSections[i].time
        var listOfCoords = checkTime(possTime)
        for(var k =0; k < listOfCoords.length; k++){
          var x = listOfCoords[k].x
          var y = listOfCoords[k].y
          value.avail[x][y]=1}
        conflict = false
        listOfSections[i].students.push(key)
        studentMap.get(key.toString()).sched = value.avail
        listOfSections[i].numStud++;
        break;
      }
    }
    if(conflict == true){
      console.log("conflict: " +conflict)
      studentMap.get(key.toString()).conflictList.push(listOfSections[0].course_id)
      if(conflicts.has(listOfSections[0].course_id)){
        conflicts.get(listOfSections[0].course_id).push(key)
      }
      else{
        conflicts.set(listOfSections[0].course_id, [key])
      }
    }

  })

}

function updateSectionHTML(c, s){
  var sections = sectionMap.get(c.toString())
  var textTime = document.getElementById(c+"text"+s)
  textTime.innerHTML = sections[s-1].time
  var numStudText = document.getElementById(c+"num"+s)
  numStudText.innerHTML = sections[s-1].numStud
}

function updateCourseHTML(c){
  var sections = sectionMap.get(c.toString())
  for(var i =0; i < sections.length;i++){
    updateSectionHTML(c, sections[i].sec_num)
  }

}

function checkFree(availMap, time){
  var listOfCoords = checkTime(time)
  var count = 0
  for(var i =0; i < listOfCoords.length; i++){
    var x = listOfCoords[i].x
    var y = listOfCoords[i].y

    if(availMap[x][y] ==0){
      count++
    }
    if(count == listOfCoords.length){
      return true;
    }
  }
}






