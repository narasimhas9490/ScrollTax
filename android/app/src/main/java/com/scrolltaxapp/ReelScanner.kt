package com.scrolltaxapp

import android.graphics.Rect
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Walks the active window. If a node whose view id matches the platform's
 * keywords is found, returns what identifies the reel currently on screen, else null:
 * the page index when the feed is a pager that numbers its pages (Instagram), otherwise
 * its author/caption texts, ignoring counters and timers (X). The set is empty while the
 * viewer is open but nothing identifies the reel yet (mid-swipe, loading).
 */
object ReelScanner {
    private const val MAX_DEPTH = 40
    private const val MAX_TEXTS = 5

    // Counters ("77", "1.1K") and playback timers ("0:12", "-2:38", "0:12 / 1:30"). They change while
    // the same reel plays, so they must never be part of its identity. The leading sign may be a
    // hyphen, a minus sign (U+2212) or an en dash (U+2013).
    private val numeric = Regex("^[-\u2212\u2013+]?[\\d.,:%]+(\\s?/\\s?[\\d.,:]+)?\\s?[KMBkmb]?$")

    // Button labels that are identical on every reel; ignored when fingerprinting.
    private val noise = setOf(
        "back", "more options", "from", "follow", "following", "reply", "repost", "like", "bookmark", "share",
        "pause", "play", "mute", "unmute", "full-screen", "dock video player", "comment", "send", "save", "more",
    )

    fun currentReel(root: AccessibilityNodeInfo, platform: Platform): Set<String>? {
        val container = findContainer(root, platform, 0) ?: return null
        // Labels on a reel come and go while it plays (like counts, "Shop now", comment bubbles),
        // so a page index is preferred whenever the feed provides one.
        val area = Rect().also(container::getBoundsInScreen).let { it.width() * it.height() }
        pageIndex(container, area, 0)?.let { return setOf(it) }
        // A set, so labels shown twice (avatar + name, "From" chip) don't use up the cap and push the caption out.
        val texts = LinkedHashSet<String>(MAX_TEXTS)
        collectTexts(container, texts, 0)
        return texts
    }

    private fun findContainer(n: AccessibilityNodeInfo, p: Platform, depth: Int): AccessibilityNodeInfo? {
        if (depth > MAX_DEPTH) return null
        val id = n.viewIdResourceName
        if (id != null && n.isVisibleToUser && p.keywords.any { id.contains(it, ignoreCase = true) }) return n
        for (i in 0 until n.childCount) {
            val c = n.getChild(i) ?: continue
            findContainer(c, p, depth + 1)?.let { return it }
        }
        return null
    }

    /**
     * Finds the feed's pager (a list covering most of the viewer whose children carry collection
     * item info) and returns the index of the page that fills most of it, so a half-swiped
     * neighbour is not mistaken for the current reel.
     */
    private fun pageIndex(n: AccessibilityNodeInfo, viewerArea: Int, depth: Int): String? {
        if (depth > MAX_DEPTH || !n.isVisibleToUser) return null
        if (n.collectionInfo != null) {
            val pager = Rect().also(n::getBoundsInScreen)
            if (pager.width() * pager.height() * 2 >= viewerArea) {
                var best: AccessibilityNodeInfo.CollectionItemInfo? = null
                var bestArea = 0
                for (i in 0 until n.childCount) {
                    val c = n.getChild(i) ?: continue
                    val item = c.collectionItemInfo ?: continue
                    val r = Rect().also(c::getBoundsInScreen)
                    if (!c.isVisibleToUser || !r.intersect(pager)) continue
                    val a = r.width() * r.height()
                    if (a > bestArea) {
                        bestArea = a
                        best = item
                    }
                }
                best?.let { return "#${it.rowIndex}:${it.columnIndex}" }
            }
        }
        for (i in 0 until n.childCount) {
            val c = n.getChild(i) ?: continue
            pageIndex(c, viewerArea, depth + 1)?.let { return it }
        }
        return null
    }

    private fun collectTexts(n: AccessibilityNodeInfo, out: MutableSet<String>, depth: Int) {
        if (out.size >= MAX_TEXTS || depth > MAX_DEPTH || !n.isVisibleToUser) return
        val t = (n.text ?: n.contentDescription)?.toString()?.trim()
        if (!t.isNullOrEmpty() && t.length > 2 && !numeric.matches(t) && t.lowercase() !in noise) out.add(t.take(80))
        for (i in 0 until n.childCount) {
            val c = n.getChild(i) ?: continue
            collectTexts(c, out, depth + 1)
            if (out.size >= MAX_TEXTS) return
        }
    }
}
