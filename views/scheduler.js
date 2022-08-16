
//Global Variables
var sectionlist =[]
var courseSections = new Map()
var courseID = []
var teacherMap = new Map();
var studentSchedule = new Map();
var coursesToSched = []
var studentRequests = new Map();
var courseRequests = new Map();
var studentMap = new Map();
var timeSlotMap = new Map();
var hasSaved = false;
var timeIndexMap = new Map();
var sectionMap = new Map()
var conflicts = new Map()
var readyToEdit = true


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

function editCourse(){
  var coursesToEdit = []
  for(var i =0; i < courseID.length; i++)
  {
    var x = document.getElementById(courseID[i]+"check")
    if(x.checked){coursesToEdit.push(courseID[i])}
  }
  for(var i =0; i < coursesToEdit.length; i++){
    var course = coursesToEdit[i]

    var sections = sectionMap.get(course.toString())
    
    for(var j =0 ; j< sections.length; j++){
      var timeslot =document.getElementById(course+ "timeSlot" + sections[j].sec_num)
      var teachers = document.getElementById(course + "tID" + sections[j].sec_num)
      var savebtn = document.getElementById(course+ "save" + sections[j].sec_num)
      var deletebtn = document.getElementById(course+ "delete" + sections[j].sec_num)
      if(readyToEdit){
        timeslot.hidden = false
        teachers.hidden = false
        savebtn.hidden = false
        deletebtn.hidden = false
        timeSlotMap.forEach((value, key) => {
            timeslot.innerHTML += "<option value =" + key + ">" + key + "</option>"
          })
        teacherMap.forEach((value, key) => {
            teachers.innerHTML += "<option value =" + key + ">" + key+ ": "+ value.name + "</option>"
          })
      }
      else{
        timeslot.hidden = true
        teachers.hidden = true
        savebtn.hidden =  true
        deletebtn.hidden = true
      }
      }
    }
    if(readyToEdit){
      readyToEdit = false
      document.getElementById('editCourseBtn').innerHTML = "Done"
    }
    else{
      readyToEdit = true
      document.getElementById('editCourseBtn').innerHTML = "Edit Course"
    }

  }
  

function deleteSection(c, s){
  var table= document.getElementById('sectionTable')
  var tr = table.getElementsByTagName("tr")
  
  for(var i =1; i <tr.length; i++){
    tdCourse = tr[i].getElementsByTagName("td")

    for(var j =0; j < tdCourse.length; j++)
    {
      if(c.toString() == tdCourse[0].children[0].innerHTML.trim() && tdCourse[2].innerHTML == s.toString())
      { 
        found = true
        tr[i].style.display= 'none'
        break
      }
      if(c.toString()== tdCourse[0].children[1].innerHTML.trim() && tdCourse[2].innerHTML == s.toString())
      {
        found = true
        tr[i].style.display= 'none'
        break
      }
    }
}
//Update sectionList
//Update sectionNums!
}
function editSection(c, s){
  var sections = sectionMap.get(c)
  var selection = document.getElementById(c + "timeSlot" + s)
  var selectedTime = selection.options[selection.selectedIndex].value;

  selection = document.getElementById(c + "tID" + s)
  var selectedTeacher = selection.options[selection.selectedIndex].value;

  var timeText = document.getElementById(c + "timeslotp" + s)
  var tidText = document.getElementById(c + "tidp" + s)

  var currTeacher = tidText.innerHTML.trim()
  console.log("CurrTeacher "+ currTeacher)

  timeText.innerHTML = selectedTime
  for(var i =0; i < sections.length; i++){
    if(sections[i].sec_num ==s){
      sections[i].timeSlot = selectedTime
    }
  }

  var newTeacherID = selectedTeacher.substring(0, 3)
  console.log("New Teacher " + newTeacherID)

  var teacherName = teacherMap.get(newTeacherID).name


  var tN = document.getElementById(c + "teacherName" + s)
  
  var currTime = document.getElementById(c + "text" + s).innerHTML
  console.log(currTime)
  console.log(currTime.length)
  const pattern = /[a-z][0-9]/i

  
  if(pattern.test(currTime) && newTeacherID!= currTeacher){
    var availMap = teacherMap.get(newTeacherID).sched
    if(checkFree(availMap, currTime)){
      scheduleTeacher(c, s, newTeacherID, currTime)
      unscheduleTeacher(c, s, currTeacher)
      for(var i =0; i < sections.length; i++){
        if(sections[i].sec_num ==s){
          sections[i].teacherID =newTeacherID
          sections[i].teacher = teacherName
        }
      }
      tidText.innerHTML = newTeacherID
      tN.innerHTML = teacherName

    }
    else{
      console.log("Teacher is not free")
    }
  }
  else{
    if(newTeacherID!= currTeacher){
      for(var i =0; i < sections.length; i++){
          if(sections[i].sec_num ==s){
            sections[i].teacherID =newTeacherID
            sections[i].teacher = teacherName
          }
        }
      tidText.innerHTML = newTeacherID
      tN.innerHTML = teacherName
  }
}
console.log(sectionMap)
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

    localStorage.teacherMapSave = JSON.stringify(Array.from(teacherMap))

    localStorage.timeIndexMapSave = JSON.stringify(Array.from(timeIndexMap))

    }

function scheduleCourse(c){
  var teacherID = []
  var teacherNames = []
  var studentList = courseRequests.get(c.toString())
  var studentAvail = new Map()
  var course;
  var teacherAvail = new Map()
  var possibleTimes = new Map()
  var teacher;
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

              }
              else{
                var index = listOfTimes.indexOf(currTime)
                var totalStudents = listOfTotalStudents[index]
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
      teacher = listOfSections[i].teacherID
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

function filter(){
  var grade;
  var sec;
  var sections = []
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

  if(document.getElementById('1').checked){
    sec = 1
  }
  else if(document.getElementById('2').checked){
    sec = 2
  }
  else if(document.getElementById('3').checked){
    sec = 3
  }
  else if(document.getElementById('4').checked){
    sec = 4
  }
  else if(document.getElementById('5').checked){
    sec = 5
  }
  console.log(grade)
  console.log("section" + sec)
  if(grade!=undefined && sec!=undefined){
    sectionMap.forEach((value, key) =>{
      if(value.length == sec && value[0].grade == grade.toString()){
        sections = sections.concat(value)
      }
    })
  }
  else if(grade!=undefined){
    sectionMap.forEach((value, key) =>{
      if(value[0].grade == grade.toString()){
        sections = sections.concat(value)
      }
    })
  }
  else if(sec!=undefined){
    sectionMap.forEach((value, key) =>{
      console.log("length" + value.length)
      console.log("sec" + sec)
      if(value.length == sec){
        sections = sections.concat(value)
      }
      if(sec == 5){
        if(value.length > 5){
          sections = sections.concat(value)
        }
      }
    })
  }
  console.log(sections)
  var table= document.getElementById('sectionTable')
  var tr = table.getElementsByTagName("tr")
  //var table = document.getElementById("filterSections")
  var len = table.rows.length
  var found = false
  for(var i =1; i <tr.length; i++){
    tdCourse = tr[i].getElementsByTagName("td")
    for(var j =0; j < sections.length; j++)
    {
      if(sections[j].course_id == tdCourse[0].children[0].innerHTML.trim())
      { 
        found = true
        tr[i].style.display= ""
        break
      }
      if(sections[j].course_id == tdCourse[0].children[1].innerHTML.trim())
      {
        found = true
        tr[i].style.display= ""
        break
      }
    }
    if(found == false){
    tr[i].style.display = "none"
    }
    found = false
    }
    
  }
  function clearFilter(){
    var table= document.getElementById('sectionTable')
    var tr = table.getElementsByTagName("tr")

    for(var i =0; i < tr.length; i++){
      tr[i].style.display = ""
    }

    //Clear radio buttons
    var grade = document.getElementsByName("grade")
    for(var i =0; i < grade.length; i++){
      grade[i].checked = false
    }
    var sec = document.getElementsByName("sec")
    for(var i =0; i < sec.length; i++){
      sec[i].checked = false
    }

  }
  
function makeHeatMap(){
  sectionlist = JSON.parse(localStorage.getItem("SecList"))
  teacherMap = new Map(JSON.parse(localStorage.teacherMapSave))
  timeIndexMap = new Map(JSON.parse(localStorage.timeIndexMapSave))
  console.log(sectionlist)
  console.log(timeIndexMap)
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
  console.log(teacherMap)
  var scheduleCounts = teacherMap.get('101').sched
  
  for(var i =0; i < scheduleCounts.length; i++)
  {
    for(var j=0; j < scheduleCounts[0].length; j++)
    {
      scheduleCounts[i][j] = 0;
    }
  }
  console.log(scheduleCounts)
  for(var i =0; i < sectionlist.length; i++)
  {
    if(sectionlist[i].grade == grade.toString())
    {
      listOfSections.push(sectionlist[i]);
    }
  }
  for(var j =0; j< listOfSections.length; j++){
    var listOfCoords = []
    var time = listOfSections[j].time
    for(var i =0; i < time.length-1; i+=2){
      var check = time.substring(i, i+2)
      var ind = timeIndexMap.get(check)
      listOfCoords.push(ind)
    }
    for(var k =0; k < listOfCoords.length; k++){
      scheduleCounts[listOfCoords[k].x][listOfCoords[k].y]++
    }
  }

  for(var i=0; i < scheduleCounts.length; i++)
  {
    for(var j =0; j< scheduleCounts[0].length; j++)
    {
      if(scheduleCounts[i][j]/listOfSections.length > 0.7){
        document.getElementById('A1').style.backgroundColor = 'red'
      }
      else if(scheduleCounts[i][j]/listOfSections.length > 0.5){
        document.getElementById('A1').style.backgroundColor = 'yellow'
      }
      else{
        document.getElementById('A1').style.backgroundColor = 'green'
      }
    }
  }
  console.log(scheduleCounts)
  console.log(listOfSections)
  addTableRows(listOfSections)
}

function addTableRows(sections){
  var table = document.getElementById("mapSections")
  var len = document.getElementById("mapSections").rows.length
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
function scheduleTeacher(c, s, tID, currTime){
  var listOfCoords = checkTime(currTime)
  var avail = teacherMap.get(tID.toString()).sched
  for(var j =0; j < listOfCoords.length; j++){
    var x = listOfCoords[j].x
    var y = listOfCoords[j].y
    avail[x][y]=1
  }
  teacherMap.get(tID.toString()).sched = avail
}

function unscheduleTeacher(c, s, tID){
  console.log(c)
  console.log(tID)
  var secs = sectionMap.get(c)
  for(var i =0; i < secs.length; i++){
    if(secs[i].sec_num ==s){
      var currTime = secs[i].time
    }
  }

  var listOfCoords = checkTime(currTime)
  var avail = teacherMap.get(tID.toString()).sched
  for(var j =0; j < listOfCoords.length; j++){
    var x = listOfCoords[j].x
    var y = listOfCoords[j].y
    avail[x][y]=0
  }
  teacherMap.get(tID).sched = avail

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








