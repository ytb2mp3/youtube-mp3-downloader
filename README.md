# Youtube MP3 Downloader

Youtube MP3 Downloader is a module which allows to specify YouTube videos from which the audio data should be extracted, converted to MP3, and stored on disk.

## Installation

### Prerequisites

To run this project, you need to have a local installation of FFmpeg present on your system. You can download it from https://www.ffmpeg.org/download.html

### Installation via NPM

`npm install youtube-mp3-downloader --save`

### Installation from Github

#### Checkout the project from Github to a local folder

`git clone https://github.com/tobilg/youtube-mp3-downloader.git`

#### Install module dependencies

Navigate to the folder where you checked out the project to in your console. Run `npm install`.

## Running

### Basic example

A basic usage example is the following:

```javascript
var YoutubeMp3Downloader = require('youtube-mp3-downloader');

//Configure YoutubeMp3Downloader with your settings
var YD = new YoutubeMp3Downloader({
    "ffmpegPath": "/path/to/ffmpeg",        // Where is the FFmpeg binary located?
    "outputPath": "/path/to/mp3/folder",    // Where should the downloaded and encoded files be stored?
    "youtubeVideoQuality": "highest",       // What video quality should be used?
    "queueParallelism": 2,                  // How many parallel downloads/encodes should be started?
    "progressTimeout": 2000                 // How long should be the interval of the progress reports
});

//Download video and save as MP3 file
YD.download("xh0ctVznxdM");

YD.on("finished", function(data) {
    console.log(data);
});

YD.on("error", function(error) {
    console.log(error);
});

YD.on("progress", function(progress) {
    console.log(progress);
});
```

You can also pass a file name for the respective video, which will then be used. Otherwise, the file name will be derived from the video title.
```javascript
YD.download("xh0ctVznxdM", "Winter By CyberSDF.mp3");
```

While downloading, every `progressTimeout` timeframe, there will be an `progress` event triggered, outputting an object like

```javascript
{
    "videoId": "xh0ctVznxdM",
    "progress": {
        "percentage": 76.81,
        "transferred": 5619680,
        "length": "7315910",
        "remaining": 1696230,
        "eta": 3,
        "runtime": 8,
        "delta": 1834992,
        "speed": 661138.82
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
    "videoId": "xh0ctVznxdM",
    "file": "/path/to/mp3/folder/Winter By CyberSDF.mp3",
    "youtubeUrl": "http://www.youtube.com/watch?v=xh0ctVznxdM",
    "videoTitle": "Winter By CyberSDF ( Genre : Ambient ) Creative Commons",
    "artist": "Unknown",
    "title": "Winter By CyberSDF ( Genre : Ambient ) Creative Commons",
    "stats": {
        "transferred": 7315910,
        "runtime": 9,
        "averageSpeed": 713747.31
    }
}
```

### Detailed example

To use it in a class which provides the downloading functionality, you could use it like this:

**Downloader.js**
```javascript
var YoutubeMp3Downloader = require('youtube-mp3-downloader');

var Downloader = function() {
	var self = this;
    
    //Configure YoutubeMp3Downloader with your settings
    self.YD = new YoutubeMp3Downloader({
        "ffmpegPath": "/path/to/ffmpeg",        // Where is the FFmpeg binary located?
        "outputPath": "/path/to/mp3/folder",    // Where should the downloaded and encoded files be stored?
        "youtubeVideoQuality": "highest",       // What video quality should be used?
        "queueParallelism": 2,                  // How many parallel downloads/encodes should be started?
        "progressTimeout": 2000                 // How long should be the interval of the progress reports
    });

	self.callbacks = {};

	self.YD.on("finished", function(data) {
		
		if (self.callbacks[data.videoId]) {
			self.callbacks[data.videoId](null,data);
		} else {
			console.log("Error: No callback for videoId!");
		}
	
    });

	self.YD.on("error", function(error) {
        console.log(error);
    });
	
}

Downloader.prototype.getMP3 = function(track, callback){
	var self = this;
	
	// Register callback
	self.callbacks[track.videoId] = callback;
	// Trigger download
    self.YD.download(track.videoId, track.name);
	
}

module.exports = Downloader;
```

This class can then be used like this:

**usage.js**
```javascript
var Downloader = require("./Downloader");
var dl = new Downloader();
var i = 0;

dl.getMP3({videoId: "xh0ctVznxdM", name: "Winter By CyberSDF.mp3"}, function(err,res){
	i++;
	if(err)
		throw err;
	else{
		console.log("Song "+ i + " was downloaded: " + res.file);
	}
});

dl.getMP3({videoId: "gQH0t8obtEg", name: "United By PlatinumEDM.mp3"}, function(err,res){
	i++;
	if(err)
		throw err;
	else{
		console.log("Song "+ i + " was downloaded: " + res.file);
	}
});
```