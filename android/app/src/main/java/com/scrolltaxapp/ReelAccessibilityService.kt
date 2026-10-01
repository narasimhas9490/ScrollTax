package com.scrolltaxapp

import android.accessibilityservice.AccessibilityService
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent

/**
 * Watches the supported apps, feeds [ReelTracker], drives the overlay pill and widget.
 * Declared for the supported apps only (see accessibility_config.xml); it cannot see any other app.
 */
class ReelAccessibilityService : AccessibilityService(), ReelTracker.Listener {
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var db: ReelDb
    private lateinit var overlay: OverlayController
    private lateinit var tracker: ReelTracker

    private var foreground: Platform? = null
    private var scanPending = false

    private val scan = Runnable {
        scanPending = false
        scanNow()
    }

    private val screenOff = object : BroadcastReceiver() {
        override fun onReceive(c: Context?, i: Intent?) = leave()
    }

    override fun onServiceConnected() {
        db = ReelDb.get(this)
        overlay = OverlayController(this)
        tracker = ReelTracker(this)
        registerReceiver(screenOff, IntentFilter(Intent.ACTION_SCREEN_OFF))
    }

    override fun onAccessibilityEvent(e: AccessibilityEvent) {
        // The service is declared for the supported apps only, so every event is one of them.
        val platform = Platforms.byPackage(e.packageName?.toString()) ?: return
        // Also adopt the app on any event when none is tracked (service enabled while the app is already open).
        if ((e.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || foreground == null) && foreground != platform) {
            leave()
            foreground = platform
            overlay.show(db.today().first)
            misses = 0
            handler.postDelayed(watchdog, 1000)
        }
        if (platform == foreground) schedule()
    }

    /**
     * We receive no events once the user switches to an unsupported app (and cannot read its
     * window), so poll once a second: two misses in a row means the app is no longer in front.
     */
    private val watchdog = object : Runnable {
        override fun run() {
            val f = foreground ?: return
            val front = rootInActiveWindow?.packageName?.toString()
            misses = if (front == f.pkg) 0 else misses + 1
            if (misses >= 2) leave() else handler.postDelayed(this, 1000)
        }
    }
    private var misses = 0

    /** Content events fire constantly during video playback; scan at most every 150ms. */
    private fun schedule() {
        if (scanPending) return
        scanPending = true
        handler.postDelayed(scan, 150)
    }

    private fun scanNow() {
        val platform = foreground ?: return
        val root = rootInActiveWindow ?: return
        if (root.packageName?.toString() != platform.pkg) return
        tracker.update(platform.id, ReelScanner.currentReel(root, platform), System.currentTimeMillis())
    }

    private fun leave() {
        handler.removeCallbacks(scan)
        handler.removeCallbacks(watchdog)
        scanPending = false
        foreground = null
        tracker.end(System.currentTimeMillis())
        overlay.hide()
    }

    override fun onReelStarted(platform: String, startTs: Long): Long {
        val id = db.insert(platform, startTs)
        refresh()
        return id
    }

    override fun onReelEnded(token: Long, durationMs: Long, keep: Boolean) {
        if (keep) db.finish(token, durationMs) else db.delete(token)
        refresh()
    }

    private fun refresh() {
        if (foreground != null) overlay.show(db.today().first)
        CountWidgetProvider.update(this)
    }

    override fun onInterrupt() = leave()

    override fun onDestroy() {
        if (::tracker.isInitialized) leave()
        runCatching { unregisterReceiver(screenOff) }
        super.onDestroy()
    }
}
