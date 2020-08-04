# Youtube MP3 Downloader

Youtube MP3 Downloader is a module which allows to specify YouTube videos from which the audio data should be extracted, converted to MP3, and stored on disk.

## Installation

### Prerequisites

To run this project, you need to have a local installation of FFmpeg present on your system. You can download it from https://www.ffmpeg.org/download.html

### Installation via NPM

`npm install youtube-mp3-downloader --save`

### Installation from Github

#### Checkout the project from Github to a local folder

`git clone https://github.com/ytb2mp3/youtube-mp3-downloader.git`

#### Install module dependencies

Navigate to the folder where you checked out the project to in your console. Run `npm install`.

## Running

### Basic example

A basic usage example is the following:

```javascript
var YoutubeMp3Downloader = require("youtube-mp3-downloader");

//Configure YoutubeMp3Downloader with your settings
var YD = new YoutubeMp3Downloader({
    "ffmpegPath": "/path/to/ffmpeg",        // FFmpeg binary location
    "outputPath": "/path/to/mp3/folder",    // Output file location (default: the home directory)
    "youtubeVideoQuality": "highestaudio",  // Desired video quality (default: highestaudio)
    "queueParallelism": 2,                  // Download parallelism (default: 1)
    "progressTimeout": 2000,                // Interval in ms for the progress reports (default: 1000)
    "allowWebm": false                      // Enable download from WebM sources (default: false)
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
```

You can also pass a file name for the respective video, which will then be used. Otherwise, the file name will be derived from the video title.
```javascript
YD.download("Vhd6Kc4TZls", "Cold Funk - Funkorama.mp3");
```

While downloading, every `progressTimeout` timeframe, there will be an `progress` event triggered, outputting an object like

```javascript
{
    "videoId": "Vhd6Kc4TZls",
    "progress": {
        "percentage": 72.29996914191304,
        "transferred": 19559221,
        "length": 27052876,
        "remaining": 7493655,
        "eta": 2,
        "runtime": 6,
        "delta": 6591454,
        "speed": 3009110.923076923
    }
}
```

Furthermore, there will be a `queueSize` event emitted when the queue size changes (both positive and negative). This can be caught via

```javascript
YD.on("queueSize", function(size) {
    console.log(size);
});
```

Upon finish, the following output will be returned:

```javascript
{
    "videoId": "Vhd6Kc4TZls",
    "stats": {
        "transferredBytes": 27052876,
        "runtime": 7,
        "averageSpeed": 3279136.48
    },
    "file": "/path/to/mp3/folder/Cold Funk - Funkorama.mp3",
    "youtubeUrl": "http://www.youtube.com/watch?v=Vhd6Kc4TZls",
    "videoTitle": "Cold Funk - Funkorama - Kevin MacLeod | YouTube Audio Library",
    "artist": "Cold Funk",
    "title": "Funkorama",
    "thumbnail": "https://i.ytimg.com/vi/Vhd6Kc4TZls/hqdefault.jpg"
}
```

### Detailed example

To use it in a class which provides the downloading functionality, you could use it like the following (which can also be found in the `examples` subfolder of this project):

**downloader.js**
```javascript
var YoutubeMp3Downloader = require("youtube-mp3-downloader");

var Downloader = function() {

    var self = this;
    
    //Configure YoutubeMp3Downloader with your settings
    self.YD = new YoutubeMp3Downloader({
        "ffmpegPath": "/path/to/ffmpeg",        // FFmpeg binary location
        "outputPath": "/path/to/mp3/folder",    // Output file location (default: the home directory)
        "youtubeVideoQuality": "highestaudio",  // Desired video quality (default: highestaudio)
        "queueParallelism": 2,                  // Download parallelism (default: 1)
        "progressTimeout": 2000                 // Interval in ms for the progress reports (default: 1000)
        "outputOptions" : ["-af", "silenceremove=1:0:-50dB"] // Additional output options passend to ffmpeg
    });

    self.callbacks = {};

    self.YD.on("finished", function(error, data) {
		
        if (self.callbacks[data.videoId]) {
            self.callbacks[data.videoId](error, data);
        } else {
            console.log("Error: No callback for videoId!");
        }
    
    });

    self.YD.on("error", function(error, data) {
	
        console.error(error + " on videoId " + data.videoId);
    
        if (self.callbacks[data.videoId]) {
            self.callbacks[data.videoId](error, data);
        } else {
            console.log("Error: No callback for videoId!");
        }
     
    });

};

Downloader.prototype.getMP3 = function(track, callback){

    var self = this;
	
    // Register callback
    self.callbacks[track.videoId] = callback;
    // Trigger download
    self.YD.download(track.videoId, track.name);

};

module.exports = Downloader;
```

This class can then be used like this:

**example1.js**
```javascript
var Downloader = require("./downloader");
var dl = new Downloader();
var i = 0;

dl.getMP3({videoId: "Vhd6Kc4TZls", name: "Cold Funk - Funkorama.mp3"}, function(err,res){
    i++;
    if(err)
        throw err;
    else{
        console.log("Song "+ i + " was downloaded: " + res.file);
    }
});
```
