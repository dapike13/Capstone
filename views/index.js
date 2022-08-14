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
function myF() {
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
        document.write(JSON.stringify(data));
        fetch("/data", {
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
function myS() {
  console.log("YEAH")
      const myForm = document.getElementById('StuSched');
      const csvFile = document.getElementById('sched');

      myForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const input = csvFile.files[0];
        const reader = new FileReader();
      reader.onload = function (e) {
        
        const text = e.target.result;
        //document.write(text)
        const data = csvToArray(text)
        document.write(JSON.stringify(data));
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
/**
function teacherSched() {
  var t = document.getElementById('tSearch').value
  fetch("/teachers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({teacher: t}),
  })
  .catch(function(error){
    console.log(error)
  })
  
}
**/

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
  console.log("Please work")
  var selection = document.getElementById('dataEntry')
  var s = selection.options[selection.selectedIndex].value;
  var sec = document.getElementById('enterSections')
  var stu = document.getElementById('enterStudents')
  var sched = document.getElementById('enterSched')
  var times = document.getElementById('enterTimes')
    
  if(s == 'sections'){
    sec.hidden = false
    stu.hidden = true
    sched.hidden = true
    times.hidden = true
  }
  else if(s == 'students'){
    stu.hidden = false
    sec.hidden = true
    sched.hidden = true
    times.hidden = true
  }
  else if(s == 'teachers'){
    stu.hidden = true
    sec.hidden = true
    sched.hidden = true
    times.hidden = true
  }
  else if(s == 'data'){
    stu.hidden = true
    sec.hidden = true
    sched.hidden = false
    times.hidden = false
  }
  else{
    stu.hidden = true
    sec.hidden = true
    sched.hidden = true
    times.hidden = true
  }
  console.log(s)
}





