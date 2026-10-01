package com.scrolltaxapp

import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteStatement
import java.util.Calendar
import kotlin.math.pow
import kotlin.random.Random

/**
 * Imaginary scrolling history for store screenshots: three months of a habit that slowly
 * shrinks. NOT part of the app. It is copied into the app only for a throwaway ".demo"
 * build that installs next to the real one (see release/README.md), so real data is never touched.
 */
object DemoData {
    private const val DAYS_BACK = 92
    private const val TODAY_COUNT = 143
    private val platforms = listOf("instagram" to 50, "youtube" to 27, "twitter" to 10, "facebook" to 8, "snapchat" to 5)

    fun seedIfEmpty(db: SQLiteDatabase) {
        val empty = db.rawQuery("SELECT COUNT(*) FROM reel", null).use { it.moveToFirst(); it.getInt(0) == 0 }
        if (!empty) return
        val rnd = Random(7)
        val now = System.currentTimeMillis()
        val insert = db.compileStatement("INSERT INTO reel(platform, day, start_ts, duration_ms) VALUES(?,?,?,?)")
        db.beginTransaction()
        try {
            for (ago in DAYS_BACK downTo 0) {
                val midnight = Calendar.getInstance().apply {
                    add(Calendar.DAY_OF_YEAR, -ago)
                    set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
                }
                val dayStart = midnight.timeInMillis
                if (ago == 0) {
                    seedToday(insert, rnd, dayStart, now)
                    continue
                }
                val weekend = midnight.get(Calendar.DAY_OF_WEEK).let { it == Calendar.SATURDAY || it == Calendar.SUNDAY }
                // About 300 reels a day three months ago, about 130 now, busier at weekends.
                val base = 130 + 170 * ago / DAYS_BACK
                var left = (base * (if (weekend) 1.3 else 1.0) * rnd.nextDouble(0.75, 1.2)).toInt()
                val dayEnd = dayStart + 24 * HOUR - 1
                while (left > 0) {
                    // One sitting in one app.
                    val sitting = minOf(left, rnd.nextInt(12, 46))
                    var t = rnd.nextLong(dayStart + 7 * HOUR, dayStart + 23 * HOUR + 40 * MINUTE)
                    val platform = pick(rnd)
                    for (i in 0 until sitting) {
                        val duration = duration(rnd)
                        if (t + duration > dayEnd) break
                        add(insert, platform, t, duration)
                        t += duration + GAP
                    }
                    left -= sitting
                }
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }

    /** Today: short sittings that hop between apps, laid out backwards from a minute ago so the list looks fresh. */
    private fun seedToday(insert: SQLiteStatement, rnd: Random, dayStart: Long, now: Long) {
        var left = TODAY_COUNT
        var end = now - MINUTE
        var last = ""
        while (left > 0) {
            var platform = pick(rnd)
            while (platform == last) platform = pick(rnd)
            last = platform
            val durations = List(minOf(left, rnd.nextInt(3, 12))) { duration(rnd) }
            val start = end - durations.sumOf { it + GAP }
            if (start < dayStart + 5 * MINUTE) return
            var t = start
            for (d in durations) {
                add(insert, platform, t, d)
                t += d + GAP
            }
            left -= durations.size
            // Mostly a quick switch to another app, sometimes a real break.
            end = start - if (rnd.nextInt(10) < 6) rnd.nextLong(15_000, 90_000) else rnd.nextLong(10 * MINUTE, 45 * MINUTE)
        }
    }

    /** Most reels get a few seconds, a few hold attention for longer. */
    private fun duration(rnd: Random): Long = (2_000 + rnd.nextDouble().pow(3) * 43_000).toLong()

    private fun add(insert: SQLiteStatement, platform: String, startTs: Long, durationMs: Long) {
        insert.bindString(1, platform)
        insert.bindString(2, ReelDb.dayOf(startTs))
        insert.bindLong(3, startTs)
        insert.bindLong(4, durationMs)
        insert.executeInsert()
    }

    private fun pick(rnd: Random): String {
        var n = rnd.nextInt(platforms.sumOf { it.second })
        for ((name, weight) in platforms) {
            if (n < weight) return name
            n -= weight
        }
        return platforms.first().first
    }

    private const val GAP = 500L // between two reels
    private const val MINUTE = 60_000L
    private const val HOUR = 60 * MINUTE
}
