var YoutubeMp3Downloader = require("../index");

//Configure YoutubeMp3Downloader with your settings
var YD = new YoutubeMp3Downloader({
    "ffmpegPath": "/usr/local/bin/ffmpeg",  // FFmpeg binary location
    "queueParallelism": 2,                  // Download parallelism (default: 1)
    "progressTimeout": 2000                 // Interval in ms for the progress reports (default: 1000)
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
