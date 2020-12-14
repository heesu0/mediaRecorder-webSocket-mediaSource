'use strict';

const socket = io.connect('http://localhost:80');
const mediaSource = new MediaSource();
const delayQueue = [];
let sourceBuffer;
let mediaRecorder;
let duration;

const camVideo = document.querySelector('video#cam');
const socketVideo = document.querySelector('video#socket');
const streamingButton = document.querySelector('button#streaming');
streamingButton.onclick = toggleStreaming;

navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia;

const constraints = {
    audio: true,
    video: true
};

navigator.getUserMedia(constraints, successCallback, errorCallback);

mediaSource.addEventListener('sourceopen', function (e) {
    //const mimeCodec = 'video/mp4; codecs="avc1.42E01E, opus"';
    const mimeCodec = 'video/webm; codecs="vp8, opus"';
    sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
    sourceBuffer.addEventListener('updateend', function () {
        if (delayQueue.length > 0 && !sourceBuffer.updating) {
            sourceBuffer.appendBuffer(delayQueue.shift());
            console.log('delay Buffer fixed');
        }
    });
}, false);

socketVideo.src = window.URL.createObjectURL(mediaSource);

socket.on('return', function (data) {
    if (mediaSource.readyState == 'open') {
        // data[0] has 4. why????
        const arrayBuffer = new Uint8Array(data).slice(1);
        if (!sourceBuffer.updating && delayQueue.length == 0) {
            sourceBuffer.appendBuffer(arrayBuffer);
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
        startStreaming();
    } else {
        stopStreaming();
        streamingButton.textContent = 'Start Streaming';
    }
}

function startStreaming() {
    // const options = { mimeType: 'video/webm; codecs="h264, opus"' };
    const options = { mimeType: 'video/webm; codecs="vp8, opus"' };
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

function stopStreaming() {
    socket.disconnect();
    mediaRecorder.stop();
}