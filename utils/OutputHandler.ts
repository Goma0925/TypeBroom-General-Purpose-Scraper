import * as fs from "fs";

export function recordJobData(fileName: string, title: string, company:string, country:string, content: string, url: string){
  var html
    = `<br><center><div class="card" style="width:80%"><div class="card-header"><h5 class="card-title">${title} | ${company}</h5></div><div class="card-body"><p class="card-text">${content}</p><a href="${url}" class="btn btn-primary">Apply</a></div></div></center><br>`;
  html += "\n\n"

  fs.appendFile('/Users/Amon/Desktop/Selected_Jobs/'+fileName, html, (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
      // success case, the file was saved
      console.log('Data saved to: "' + fileName + '"');
  });
}

export function urlLog(fileName:string, url:string){
  var html = `
  <center><div>
    <a href="${url}">${url}</a>
  </div></center><br>
  `;

  fs.appendFile('/Users/Amon/Desktop/Selected_Jobs/'+fileName, html, (err) => {
      // throws an error, you could also catch it here
      if (err) throw err;
      // success case, the file was saved
      console.log('Data saved to: "' + fileName + '"');
  });
}
