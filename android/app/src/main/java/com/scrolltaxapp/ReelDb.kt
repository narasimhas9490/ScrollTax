package com.scrolltaxapp

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ReelDb private constructor(ctx: Context) : SQLiteOpenHelper(ctx, "reels.db", null, 1) {

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            "CREATE TABLE reel(id INTEGER PRIMARY KEY AUTOINCREMENT, platform TEXT NOT NULL, " +
                "day TEXT NOT NULL, start_ts INTEGER NOT NULL, duration_ms INTEGER NOT NULL DEFAULT 0)"
        )
        db.execSQL("CREATE INDEX reel_day ON reel(day)")
    }

    override fun onUpgrade(db: SQLiteDatabase, o: Int, n: Int) {}

    @Synchronized
    fun insert(platform: String, startTs: Long): Long = writableDatabase.insert(
        "reel", null,
        ContentValues().apply {
            put("platform", platform); put("day", dayOf(startTs)); put("start_ts", startTs)
        }
    )

    @Synchronized
    fun finish(id: Long, durationMs: Long) {
        writableDatabase.update("reel", ContentValues().apply { put("duration_ms", durationMs) }, "id=?", arrayOf("$id"))
    }

    @Synchronized
    fun delete(id: Long) {
        writableDatabase.delete("reel", "id=?", arrayOf("$id"))
    }

    @Synchronized
    fun clearAll() {
        writableDatabase.delete("reel", null, null)
    }

    /** Today's (count, totalMs). */
    @Synchronized
    fun today(): Pair<Int, Long> =
        readableDatabase.rawQuery(
            "SELECT COUNT(*), COALESCE(SUM(duration_ms),0) FROM reel WHERE day=?", arrayOf(dayOf(System.currentTimeMillis()))
        ).use { it.moveToFirst(); it.getInt(0) to it.getLong(1) }

    /** Per-day totals from [fromDay] (yyyy-MM-dd) onward. */
    @Synchronized
    fun daily(fromDay: String): JSONArray {
        val out = JSONArray()
        readableDatabase.rawQuery(
            "SELECT day, COUNT(*), SUM(duration_ms) FROM reel WHERE day>=? GROUP BY day ORDER BY day", arrayOf(fromDay)
        ).use {
            while (it.moveToNext()) out.put(JSONObject().put("day", it.getString(0)).put("count", it.getInt(1)).put("ms", it.getLong(2)))
        }
        return out
    }

    /** Every month with data: (yyyy-MM, count, totalMs, distinct days with reels). */
    @Synchronized
    fun monthly(): JSONArray {
        val out = JSONArray()
        readableDatabase.rawQuery(
            "SELECT substr(day,1,7), COUNT(*), SUM(duration_ms), COUNT(DISTINCT day) FROM reel GROUP BY 1 ORDER BY 1", null
        ).use {
            while (it.moveToNext()) out.put(
                JSONObject().put("month", it.getString(0)).put("count", it.getInt(1)).put("ms", it.getLong(2)).put("days", it.getInt(3))
            )
        }
        return out
    }

    @Synchronized
    fun reelsForDay(day: String): JSONArray {
        val out = JSONArray()
        readableDatabase.rawQuery(
            "SELECT platform, start_ts, duration_ms FROM reel WHERE day=? ORDER BY start_ts DESC", arrayOf(day)
        ).use {
            while (it.moveToNext()) out.put(JSONObject().put("platform", it.getString(0)).put("startTs", it.getLong(1)).put("durationMs", it.getLong(2)))
        }
        return out
    }

    companion object {
        @Volatile private var inst: ReelDb? = null
        fun get(ctx: Context): ReelDb = inst ?: synchronized(this) {
            inst ?: ReelDb(ctx.applicationContext).also { inst = it }
        }

        fun dayOf(ts: Long): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(ts))
    }
}
