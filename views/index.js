//JS Page for index.pug (Homepage)
//https://gist.github.com/aerrity/fd393e5511106420fba0c9602cc05d35

//Global Variables
var sectionlist =[]
var teacherMap = new Map();
var studentSchedule = new Map();
var times = ["A", "B", "C", "D", "E", "F", "G"]

var coursesToSched = []
var studentRequests = new Map();
var studentMap = new Map();

//Receive Section Data
function receiveSections(){
  console.log("WorkeD!!!!!")
  fetch("/", {
    method: "POST",})
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    console.log("It worked!!!")
    sectionlist = data.sections
    console.log(sectionlist)
  })
 .catch(function(error){
    console.log(error)
  })
}

//Upload section data
function uploadSectionData() {
      const myForm = document.getElementById('myForm');
      const csvFile = document.getElementById('csvFile');

      myForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const input = csvFile.files[0];
        const reader = new FileReader();
      reader.onload = function (e) {
        const text = e.target.result;
        //document.write(text)
        const data = csvToArray(text)
        //document.write(JSON.stringify(data));
        fetch("/sectionData", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({data: data}),
          })
     }
     reader.readAsText(input);
   })
}

//Upload student schedule data
function uploadStudentData() {
      const myForm = document.getElementById('StuSched');
      const csvFile = document.getElementById('sched');

      myForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const input = csvFile.files[0];
        const reader = new FileReader();
      reader.onload = function (e) {
        const text = e.target.result;
        const data = csvToArray(text)
        //document.write(JSON.stringify(data));
        fetch("/sched", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({data: data}),
          })
     }
     reader.readAsText(input);
   })
}

//Upload student schedule data
function uploadCourseData() {
      const myForm = document.getElementById('courses');
      const csvFile = document.getElementById('courseInput');

      myForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const input = csvFile.files[0];
        const reader = new FileReader();
      reader.onload = function (e) {
        const text = e.target.result;
        const data = csvToArray(text)
        //document.write(JSON.stringify(data));
        fetch("/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({data: data}),
          })
     }
     reader.readAsText(input);
   })
}




function scheduleCheck(s){
  console.log(s);
  console.log("Checked")
    fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({courseID: s}),
    })
    .catch(function(error){
      console.log(error)
    })
}

function updateEdit(s, n){
  fetch("/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({editBtn: true, courseID: s, secNum: n}),
  })
  .catch(function(error){
    console.log(error)
  })
}

function sendStudents(s){
  fetch("/studentSched", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }, 
    body: JSON.stringify({stu: s}),
  })
  .catch(function(error){
    console.log(error)
  })
  }


function sendData(c, s) {
  var time = document.getElementById(s).value
  fetch("/jsondata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({course: c, time: time, secNum: s}),
  })
  .catch(function(error){
    console.log(error)
  })
  
}

function csvToArray(str, delimiter = ","){
  console.log(str)
  const headers = str.slice(0, str.indexOf("\r")).split(delimiter);
  console.log(headers)
  //headers = headers.replace(/(\r)/gm, "");
  const rows = str.slice(str.indexOf("\n")+1).split("\n");
  //rows = rows.replace(/(\r)/gm, "");
  const arr = rows.map(function(row){
    const values = row.split(delimiter)
    const el = headers.reduce(function(object, header, index){
      object[header] = values[index]
      return object
    }, {})
    return el
  })
  return arr
}


function getItem(){
  var selection = document.getElementById('dataEntry')
  var s = selection.options[selection.selectedIndex].value;
  var sec = document.getElementById('enterSections')
  var stu = document.getElementById('enterStudents')
  var sched = document.getElementById('enterSched')
  var times = document.getElementById('enterTimes')
  var user = document.getElementById('enterUser')
  var courses = document.getElementById('enterCourses')
    
  if(s == 'sections'){
    sec.hidden = false
    stu.hidden = true
    sched.hidden = true
    times.hidden = true
    user.hidden = true
    courses.hidden = true
  }
  else if(s == 'students'){
    stu.hidden = false
    sec.hidden = true
    sched.hidden = true
    times.hidden = true
    user.hidden = true
    courses.hidden = true
  }
  else if(s == 'teachers'){
    stu.hidden = true
    sec.hidden = true
    sched.hidden = true
    times.hidden = true
    user.hidden = true
    courses.hidden = true
  }
  else if(s == 'data'){
    stu.hidden = true
    sec.hidden = true
    sched.hidden = false
    times.hidden = false
    user.hidden = true
    courses.hidden = true
  }
  else if(s =='user'){
    stu.hidden = true
    sec.hidden = true
    sched.hidden = true
    times.hidden = true
    user.hidden = false
    courses.hidden = true
  }
  else if(s == "courses"){
    stu.hidden = true
    sec.hidden = true
    sched.hidden = true
    times.hidden = true
    user.hidden = true
    courses.hidden = false
  }
  else{
    stu.hidden = true
    sec.hidden = true
    sched.hidden = true
    times.hidden = true
    courses.hidden = true
  }
  console.log(s)
}

function editTime(name){
  var edit = document.getElementById(name+text)
  edit.hidden = false
}

function deleteTime(name){
  var table= document.getElementById('timeTable')
  var tr = table.getElementsByTagName("tr")
  
  for(var i =1; i <tr.length; i++){
    tdTimes = tr[i].getElementsByTagName("td")
    if(tdTimes[1].innerText == name){
      tr[i].style.display= "none"
    }
  }
  console.log(name)
  fetch("/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({name: name}),
          })
}
function keepSchedData(){
  console.log("Here")
  var sched = document.getElementById('enterSched')
  var times = document.getElementById('enterTimes')
  sched.hidden = false
  times.hidden = false

}




