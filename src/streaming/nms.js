const NodeMediaServer = require('node-media-server');

const config = {
  rtmp: {
    port: 1935,           // RTMP stream port (usually fine)
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8001,           // change from 8000 to 8001 to avoid conflict
    allow_origin: '*',
  },
  ws: {
    port: 8002,           // WebSocket port
  },
  trans: {
    ffmpeg: 'C:/ffmpeg/bin/ffmpeg.exe', 
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:flags=delete_segments]',
      },
    ],
  },
};

const nms = new NodeMediaServer(config);
nms.run();

console.log('🎥 Node Media Server running on RTMP:1935, HTTP:8001, WS:8002');

module.exports = nms;