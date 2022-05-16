//https://gist.github.com/aerrity/fd393e5511106420fba0c9602cc05d35

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
        //document.write(JSON.stringify(data));
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
  const headers = str.slice(0, str.indexOf("\n")).split(delimiter);
  const rows = str.slice(str.indexOf("\n")+1).split("\n");
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

