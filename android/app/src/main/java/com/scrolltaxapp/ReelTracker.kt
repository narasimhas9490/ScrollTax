package com.scrolltaxapp

/**
 * Pure logic (no Android deps). Feed it what the accessibility scan sees on every
 * pass: which platform's short-video feed is showing and which video is current.
 * A reel is counted the moment it becomes current, however briefly it stays
 * (fast flicks count). [minMs] can be raised to discard very short views.
 */
class ReelTracker(
    private val listener: Listener,
    private val minMs: Long = 0,
) {
    interface Listener {
        /** Returns a token identifying the stored reel. */
        fun onReelStarted(platform: String, startTs: Long): Long
        fun onReelEnded(token: Long, durationMs: Long, keep: Boolean)
    }

    private var platform: String? = null
    private var reel: Set<String> = emptySet()
    private var token = -1L
    private var startTs = 0L

    /**
     * [platform]/[reel] are null when no short-video feed is showing. [reel] holds what
     * identifies the video on screen (a page index, or its texts); empty means the viewer is open
     * but nothing identifies the video yet (mid-swipe, loading), which neither ends the current
     * reel nor starts one.
     */
    fun update(platform: String?, reel: Set<String>?, now: Long) {
        if (platform == null || reel == null) {
            end(now)
            return
        }
        if (reel.isEmpty()) return
        if (platform == this.platform && sameReel(reel)) return
        end(now)
        this.platform = platform
        this.reel = reel
        startTs = now
        token = listener.onReelStarted(platform, now)
    }

    /**
     * Apps fade a reel's labels in and out one by one around a swipe, so a subset or a
     * superset of the texts already seen is still the same reel, not a new one.
     */
    private fun sameReel(seen: Set<String>): Boolean {
        if (reel.containsAll(seen)) return true
        if (seen.containsAll(reel)) {
            reel = seen
            return true
        }
        return false
    }

    fun end(now: Long) {
        if (platform == null) return
        val duration = now - startTs
        listener.onReelEnded(token, duration, duration >= minMs)
        platform = null
        reel = emptySet()
    }
}
