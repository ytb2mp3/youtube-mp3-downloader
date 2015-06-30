"use strict";
var os = require('os');
var util = require('util');
var EventEmitter = require("events").EventEmitter;
var ffmpeg = require('fluent-ffmpeg');
var ytdl = require('ytdl-core');
var async = require('async');
var progress = require('progress-stream');

function YoutubeMp3Downloader(options) {

    var self = this;

    self.youtubeBaseUrl = 'http://www.youtube.com/watch?v=';
    self.youtubeVideoQuality = (options && options.youtubeVideoQuality ? options.youtubeVideoQuality : 'highest');
    self.outputPath = (options && options.outputPath ? options.outputPath : (os.platform() === 'win32' ? 'D:/temp' : '/tmp'));
    self.queueParallelism = (options && options.queueParallelism ? options.queueParallelism : 1);
    self.progressTimeout = (options && options.progressTimeout ? options.progressTimeout : 1000);

    if (options && options.ffmpegPath) {
        ffmpeg.setFfmpegPath(options.ffmpegPath);
    }

    //Async download/transcode queue
    self.downloadQueue = async.queue(function (task, callback) {

        self.emit("queueSize", self.downloadQueue.running() + self.downloadQueue.length());

        self.performDownload(task, function(err, result) {
            callback(err, result);
        });

    }, self.queueParallelism);

}

util.inherits(YoutubeMp3Downloader, EventEmitter);

YoutubeMp3Downloader.prototype.download = function(videoId, fileName) {

    var self = this;
    var task = {
        videoId: videoId,
        fileName: fileName
    };

    self.downloadQueue.push(task, function (err, data) {
        if (err) {
            self.emit("error", err);
        } else {
            self.emit('finished', data);
            self.emit("queueSize", self.downloadQueue.running() + self.downloadQueue.length());
        }
    });

};

YoutubeMp3Downloader.prototype.performDownload = function(task, cb) {

    var self = this;
    var videoUrl = self.youtubeBaseUrl+task.videoId;

    ytdl.getInfo(videoUrl, function(err, info){

        var videoTitle = info.title.replace(/"/g, '').replace(/'/g, '').replace(/\//g, '').replace(/\?/g, '');
        var artist = "Unknown";
        var title = "Unknown";

        if (videoTitle.indexOf("-") > -1) {
            var temp = videoTitle.split("-");
            if (temp.length >= 2) {
                artist = temp[0].trim();
                title = temp[1].trim();
            }
        } else {
            title = videoTitle;
        }

        //Derive file name, if given, use it, if not, from video title
        var fileName = (task.fileName ? self.outputPath + '/' + task.fileName : self.outputPath + '/' + videoTitle + '.mp3');

        //Stream setup
        var stream = ytdl(videoUrl, {
            quality: self.youtubeVideoQuality
        });

        stream.on("info", function(info, format) {

            var resultObj = {};

            //Setup of progress module
            var str = progress({
                length: format.size,
                time: self.progressTimeout
            });

            //Add progress event listener
            str.on('progress', function(progress) {
                if (progress.percentage === 100) {
                    resultObj.stats= {
                        transferredBytes: progress.transferred,
                        runtime: progress.runtime,
                        averageSpeed: parseFloat(progress.speed.toFixed(2))
                    }
                }
                self.emit("progress", {videoId: task.videoId, progress: progress})
            });

            //Start encoding
            var proc = new ffmpeg({
                source: stream.pipe(str)
            })
            .audioBitrate(info.formats[0].audioBitrate)
            .withAudioCodec('libmp3lame')
            .toFormat('mp3')
            .outputOptions('-id3v2_version', '4')
            .outputOptions('-metadata', 'title=' + title)
            .outputOptions('-metadata', 'artist=' + artist)
            .on('error', function(err) {
                cb(err.message, null);
            })
            .on('end', function() {
                resultObj.file =  fileName;
                resultObj.videoId = task.videoId;
                resultObj.youtubeUrl = videoUrl;
                resultObj.videoTitle = videoTitle;
                resultObj.artist = artist;
                resultObj.title = title;
                cb(null, resultObj);
            })
            .saveToFile(fileName);

        });

    });

}

module.exports = YoutubeMp3Downloader;
