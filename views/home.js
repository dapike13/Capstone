//https://gist.github.com/aerrity/fd393e5511106420fba0c9602cc05d35

function myFunction() {
  console.log("first Javascript!!!!")
}

function myF() {
      const myForm = document.getElementById('myForm');
      const csvFile = document.getElementById('csvFile');
      myForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const input = csvFile.files[0];
        const reader = new FileReader();
      reader.onload = function (e) {
        const text = e.target.result;
        const data = csvToArray(text)
        document.write(JSON.stringify(data));

      reader.readAsText(input);
     }
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

function c() {
  console.log("Fun")
  fetch('/clicked', {method: 'POST'})
  .then(function(response){
    if(response.ok){
      console.log("Great")
      return
    }

  })
  .catch(function(error) {
    console.log(error)
  })
}