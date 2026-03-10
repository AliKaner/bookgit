const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream('c:\\Users\\Ali Kaner\\bookgit-1\\public\\fonts\\NotoSans-Regular.ttf');
https.get('https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans-Regular.ttf', function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close(() => console.log('Download complete.'));
  });
}).on('error', function(err) {
  fs.unlink('c:\\Users\\Ali Kaner\\bookgit-1\\public\\fonts\\NotoSans-Regular.ttf', () => {});
  console.error('Error: ' + err.message);
});
