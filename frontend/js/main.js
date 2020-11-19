'use strict';
var socket = io.connect('http://localhost:80');
var mediaSource = new MediaSource();
var mediaBuffer;
var mediaRecorder;
var delayQueue;
var duration;

var camVideo = document.querySelector('video#cam');
var socketVideo = document.querySelector('video#socket');

var streamingButton = document.querySelector('button#streaming');
streamingButton.onclick = toggleStreaming;

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia;

var constraints = {
    audio: true,
    video: true
};

navigator.getUserMedia(constraints, successCallback, errorCallback);

mediaSource.addEventListener('sourceopen', function (e) {
    //var mimeCodec = 'video/mp4; codecs="avc1.42E01E, opus"';
    var mimeCodec = 'video/webm; codecs="vp8, opus"';
    mediaBuffer = mediaSource.addSourceBuffer(mimeCodec);
    mediaBuffer.addEventListener('updateend', function () {
        if (delayQueue.length > 0 && !mediaBuffer.updating) {
            mediaBuffer.appendBuffer(delayQueue.shift());
            console.log('delay Buffer fixed');
        }
    });
}, false);

socketVideo.src = window.URL.createObjectURL(mediaSource);

socket.on('return', function (data) {
    if (mediaSource.readyState == 'open') {
        // data[0] has 4. why????
        var arrayBuffer = new Uint8Array(data).slice(1);
        if (!mediaBuffer.updating && delayQueue.length == 0) {
            mediaBuffer.appendBuffer(arrayBuffer);
        } else {
            delayQueue.push(arrayBuffer);
        }
    }
});

function eventTest(event) {
    console.log('event Test', event);
}

function successCallback(stream) {
    console.log('getUserMedia() got stream: ', stream);
    stream.inactive = eventTest;
    window.stream = stream;
    camVideo.srcObject = stream;
    camVideo.onloadedmetadata = function (event) {
        console.log("onloadedmetadata", event);
    }
    camVideo.addEventListener('play', (event) => {
        console.log("play", event);
    });
}

function errorCallback(error) {
    console.log('navigator.getUserMedia error: ', error);
}

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        socket.emit('blob', event.data);
    }
}

function handleStop(event) {
    console.log('Recorder stopped: ', event);
}

function toggleStreaming() {
    if (streamingButton.textContent === 'Start Streaming') {
        startRecording();
    } else {
        stopRecording();
        streamingButton.textContent = 'Start Streaming';
    }
}

function startRecording() {
    // var options = { mimeType: 'video/webm; codecs="h264, opus"' };
    var options = { mimeType: 'video/webm; codecs="vp8, opus"' };
    delayQueue = [];
    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e0) {
        console.log('Unable to create MediaRecorder with options Object: ', e0);
        try {
            options = { mimeType: 'video/webm,codecs=vp9', bitsPerSecond: 100000 };
            mediaRecorder = new MediaRecorder(window.stream, options);
        } catch (e1) {
            console.log('Unable to create MediaRecorder with options Object: ', e1);
            try {
                options = 'video/vp8'; // Chrome 47
                mediaRecorder = new MediaRecorder(window.stream, options);
            } catch (e2) {
                alert('MediaRecorder is not supported by this browser.\n\n' +
                    'Try Firefox 29 or later, or Chrome 47 or later, with Enable experimental Web Platform features enabled from chrome://flags.');
                console.error('Exception while creating MediaRecorder:', e2);
                return;
            }
        }
    }
    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    streamingButton.textContent = 'Stop Streaming';
    mediaRecorder.onstop = handleStop;
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(1); // time slice 1ms
    console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
    socket.disconnect();
    mediaRecorder.stop();
}