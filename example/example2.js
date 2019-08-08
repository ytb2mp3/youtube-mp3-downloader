var YoutubeMp3Downloader = require("../index");
var os = require("os");

//Configure YoutubeMp3Downloader with your settings
var YD = new YoutubeMp3Downloader({
    "ffmpegPath": "/usr/local/bin/ffmpeg",  // Where is the FFmpeg binary located?
    "outputPath": os.tmpdir(),              // Where should the downloaded and encoded files be stored?
    "youtubeVideoQuality": "highest",       // What video quality should be used?
    "queueParallelism": 2,                  // How many parallel downloads/encodes should be started?
    "progressTimeout": 2000                 // How long should be the interval of the progress reports
});

//Download video and save as MP3 file
YD.download("Vhd6Kc4TZls");

YD.on("finished", function(err, data) {
    console.log(JSON.stringify(data));
});

YD.on("error", function(error) {
    console.log(error);
});

YD.on("progress", function(progress) {
    console.log(JSON.stringify(progress));
});
