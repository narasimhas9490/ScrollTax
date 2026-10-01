package com.scrolltaxapp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ReelTrackerTest {
    private class Rec : ReelTracker.Listener {
        var next = 0L
        val started = mutableListOf<String>()
        val ended = mutableListOf<Triple<Long, Long, Boolean>>()
        override fun onReelStarted(platform: String, startTs: Long): Long {
            started += platform; return next++
        }
        override fun onReelEnded(token: Long, durationMs: Long, keep: Boolean) {
            ended += Triple(token, durationMs, keep)
        }
    }

    private val a = setOf("a")
    private val b = setOf("b")

    @Test fun newReelIsCountedImmediately() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("instagram", a, 0)
        assertEquals(listOf("instagram"), r.started)
    }

    @Test fun sameReelIsNotCountedTwice() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("instagram", a, 0); t.update("instagram", a, 500); t.update("instagram", a, 5000)
        assertEquals(1, r.started.size)
        assertTrue(r.ended.isEmpty())
    }

    @Test fun swipeClosesPreviousWithDuration() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("instagram", a, 0); t.update("instagram", b, 4000)
        assertEquals(Triple(0L, 4000L, true), r.ended.single())
        assertEquals(2, r.started.size)
    }

    @Test fun fastFlickIsStillCounted() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("youtube", a, 0); t.update("youtube", b, 300)
        assertEquals(Triple(0L, 300L, true), r.ended.single())
        assertEquals(2, r.started.size)
    }

    @Test fun minMsCanStillDiscardShortViews() {
        val r = Rec(); val t = ReelTracker(r, minMs = 1000)
        t.update("youtube", a, 0); t.update("youtube", b, 300)
        assertFalse(r.ended.single().third)
    }

    @Test fun leavingFeedEndsReel() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("youtube", a, 0); t.update(null, null, 3000)
        assertEquals(Triple(0L, 3000L, true), r.ended.single())
        t.end(9000) // nothing open: no second event
        assertEquals(1, r.ended.size)
    }

    @Test fun switchingPlatformWithSameIdCountsNewReel() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("instagram", setOf("x"), 0); t.update("youtube", setOf("x"), 2000)
        assertEquals(listOf("instagram", "youtube"), r.started)
    }

    // Mid-swipe the viewer is open but shows nothing that identifies a reel.
    @Test fun unidentifiedViewerKeepsCurrentReel() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("twitter", a, 0); t.update("twitter", emptySet(), 300); t.update("twitter", a, 600)
        assertEquals(1, r.started.size)
        assertTrue(r.ended.isEmpty())
    }

    @Test fun unidentifiedViewerDoesNotStartAReel() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("twitter", emptySet(), 0)
        assertTrue(r.started.isEmpty())
        t.update("twitter", a, 300)
        assertEquals(1, r.started.size)
    }

    // X hides a reel's name and handle before its caption as a swipe starts.
    @Test fun labelsFadingOutAreStillTheSameReel() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("twitter", setOf("Name", "@handle", "caption"), 0)
        t.update("twitter", setOf("Name", "caption"), 300)
        t.update("twitter", setOf("caption"), 400)
        assertEquals(1, r.started.size)
    }

    @Test fun labelsFadingInAreStillTheSameReel() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("twitter", setOf("Name"), 0)
        t.update("twitter", setOf("Name", "@handle", "caption"), 300)
        t.update("twitter", setOf("@handle", "caption"), 600) // known from the fuller view above
        assertEquals(1, r.started.size)
    }

    @Test fun differentTextsAreANewReel() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("twitter", setOf("Name", "@handle", "first caption"), 0)
        t.update("twitter", setOf("Name", "@handle", "second caption"), 4000)
        assertEquals(2, r.started.size)
    }

    // Instagram: the pager's page index is the identity.
    @Test fun nextPageIsANewReel() {
        val r = Rec(); val t = ReelTracker(r)
        t.update("instagram", setOf("#44:0"), 0); t.update("instagram", setOf("#44:0"), 2000); t.update("instagram", setOf("#45:0"), 4000)
        assertEquals(2, r.started.size)
        assertEquals(Triple(0L, 4000L, true), r.ended.single())
    }
}
