const Mux = require("@mux/mux-node");
const LiveSession = require("../model/Livesession");

// 1. Mux SDK initialization (Ensure MUX_TOKEN_ID and MUX_SECRET_KEY are in your .env)
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

const { video } = muxClient;

/* =======================
   START LIVE STREAM
======================= */
const startLive = async (req, res) => {
  try {
    const { title } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
      });
    }

    if (!title || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Title is required and must be at least 3 characters long",
      });
    }

    // Create Mux live stream (production, no test)
    const liveStream = await video.liveStreams.create({
      playback_policy: ["public"],
      new_asset_settings: { playback_policy: ["public"] },
    });

    // Save session in DB
    const session = await LiveSession.create({
      hostUserId: req.user.id,
      title: title.trim(),
      streamKey: liveStream.stream_key,
      muxStreamId: liveStream.id,
      isLive: true,
    });

    // Generate playback URL
    const playbackId = liveStream.playback_ids?.[0]?.id || null;
    const playbackUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null;

    res.status(201).json({
      success: true,
      message: "Live started successfully with Mux",
      data: {
        sessionId: session._id,
        streamKey: liveStream.stream_key,
        rtmpUrl: "rtmps://global-live.mux.com:443/app",
        playbackUrl,
      },
    });
  } catch (error) {
    console.error("START LIVE ERROR 👉", error);
    res.status(500).json({
      success: false,
      message: "Server error during stream creation",
      error: error.message,
    });
  }
};

/* =======================
   END LIVE STREAM
======================= */
const endLive = async (req, res) => {
  try {
    const { streamKey } = req.body;

    if (!streamKey) {
      return res.status(400).json({
        success: false,
        message: "Stream key is required",
      });
    }

    const session = await LiveSession.findOne({ streamKey, isLive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Active live session not found",
      });
    }

    // Optional: Signal Mux to stop the live stream (if needed)
    // Most streams end automatically when the encoder disconnects
    if (session.muxStreamId) {
       await video.liveStreams.complete(session.muxStreamId);
    }

    session.isLive = false;
    session.endedAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      message: "Live ended successfully",
    });
  } catch (error) {
    console.error("END LIVE ERROR 👉", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during stream termination",
      error: error.message 
    });
  }
};

/* =======================
   GET ACTIVE LIVE SESSIONS
======================= */
const getActiveLives = async (req, res) => {
  try {
    const lives = await LiveSession.find({ isLive: true })
      .populate("hostUserId", "fullname avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      totalLives: lives.length,
      lives,
    });
  } catch (error) {
    console.error("GET ACTIVE LIVES ERROR 👉", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  startLive,
  endLive,
  getActiveLives,
};