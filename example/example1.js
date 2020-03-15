var Downloader = require("./downloader");
var dl = new Downloader();
var i = 0;

dl.getMP3({videoId: "MxXKfq86E0I"}, function(err,res){
    i++;
    if(err)
        throw err;
    else{
        console.log("Song "+ i + " was downloaded: " + res.file);
    }
});