var express = require('express');
var router = express.Router();
var request = require('request');
var cmd = require('node-cmd');
var fs = require('fs');
var https = require('https');

/* GET users listing. */
router.post('/', function(req, res, next) {

    request(req.body.youtubeUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            console.log('aaaaaa');

            var video = youtubeHtmlParser(body);

            if (video == 'error') {
                 res.send('error');
                 return;
            }

            console.log('bbbbbb');

            // if URL not containt `signature=`, call Youtube-dl lib
            if (video.links[0].url.indexOf('signature=') == -1) {
                video.links = [];
                cmd.get(
                    'youtube-dl -f best -g -s ' + req.body.youtubeUrl,
                    function(url){
                        if (url.indexOf('&gcr=') == -1) {
                            video.links.push({'quality': 'best', 'url': url});
                            res.send(video);
                        } else {
                            downloadVideo(url, getVideoId(req.body.youtubeUrl), function(urlDownload){
                                video.links.push({'quality': 'best', 'url': urlDownload});
                                res.send(video);
                            });
                        }
                    }
                );
            } else {
                res.send(video);
            }

        } else {
            res.send('error');
        }
    });

});

function getVideoId(videoUrl) {
    var video_id = videoUrl.split('v=')[1];
    var ampersandPosition = video_id.indexOf('&');
    if(ampersandPosition != -1) {
        video_id = video_id.substring(0, ampersandPosition);
    }
    return video_id;
}

function downloadVideo(urlDownload, videoId, done){
    fs.readdir('public/videos', function(err, files) {
        if (files.indexOf(videoId + ".mp4") > -1) {
            done('/videos/' + videoId + ".mp4");
        } else {
            var file = fs.createWriteStream("public/videos/" + videoId + ".mp4");
            var request = https.get(urlDownload, function(response) {
                response.pipe(file);
            });

            file.on('finish', function() {
                file.close();  // close() is async, call cb after close completes.
                done('/videos/' + videoId + ".mp4");
            }).on('error', function(err) { // Handle errors
                fs.unlink("public/videos/" + videoId + ".mp4"); // Delete the file async. (But we don't check the result)
            });
        }

    });
}

function youtubeHtmlParser(html){

    // between 'ytplayer.config =' and `;ytplayer.load = function()`
    var rawJson = html.match(/(?=ytplayer.config =).*?(?=;ytplayer.load = function())/);
  
    if (rawJson == null || rawJson[0] == null) {
        return 'error';
    }

    try {
        var objectJson = JSON.parse(rawJson[0].substring('ytplayer.config ='.length));
        var args = objectJson.args;
        var video = {};

        video.author = args.author;
        video.title = args.title;
        video.view_count = args.view_count;
        video.img = args.iurlmq.replace(/\\/g, '');
        video.links = [];

        // // get quality list
        // var streamMaps = args.adaptive_fmts.split(',');
        // var quality = [];
        // for(var i = 0, l = streamMaps.length; i < l; i++) {
        //     var temp = streamMaps[i].split('\u0026');
        //     var element = {};
        //     console.log("------------------------------------------------------------------");
        //     for (var j = 0, l1 = temp.length; j < l1; j++) {
        //         console.log(temp[j]);
        //         if (temp[j].indexOf('quality_label=') > -1 && element.quality == null)  {
        //             quality.push(temp[j].substring('quality_label='.length));
        //         }
        //     }
        //     console.log("------------------------------------------------------------------");
    
        // }

        // get video links

        var streamMaps = args.url_encoded_fmt_stream_map.split(',');

        for(var i = 0, l = streamMaps.length; i < l; i++) {
            var temp = streamMaps[i].split('\u0026');
            var element = {};

            for (var j = 0, l1 = temp.length; j < l1; j++) {
                if (temp[j].indexOf('quality=') > - 1 && element.quality == null) element.quality = temp[j].substring('quality='.length);
                if (temp[j].indexOf('url=') > - 1 && element.url == null) {
                    element.url = unescape(temp[j].substring('url='.length));
                }
            }

            video.links.push(element);
        }

        return video;
        

    } catch(e){
        console.log(e);
        return 'error';
    }
    
}

module.exports = router;
