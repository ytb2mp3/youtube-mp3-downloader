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
    self.downloadQueue = async.queue(function (videoId, callback) {

        self.performDownload(videoId, function(err, result) {
            callback(err, result);
        });

    }, self.queueParallelism);

}

util.inherits(YoutubeMp3Downloader, EventEmitter);

YoutubeMp3Downloader.prototype.download = function(videoId) {

    var self = this;

    self.downloadQueue.push(videoId, function (err, data) {
        if (err) {
            self.emit("error", err);
        } else {
            self.emit('finished', data);
        }
    });

};

YoutubeMp3Downloader.prototype.performDownload = function(videoId, cb) {

    var self = this;
    var videoUrl = self.youtubeBaseUrl+videoId;

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

        var fileName = self.outputPath + '/' + videoTitle + '.mp3';

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
                self.emit("progress", {videoId: videoId, progress: progress})
            });

            //Pipe through progress module
            var videoStream = stream.pipe(str);

            //Start encoding
            var proc = new ffmpeg({
                source: videoStream
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
                resultObj.videoId = videoId;
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
