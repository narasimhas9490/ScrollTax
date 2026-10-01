package com.scrolltaxapp

import android.content.Context

/** Small native helpers: preferences (consent flag) and duration formatting for the widget. */
object Strings {
    private const val PREFS = "scrolltax"

    fun pref(ctx: Context, key: String): String? =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(key, null)

    fun setPref(ctx: Context, key: String, value: String) =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(key, value).apply()

    fun formatDuration(ms: Long): String {
        val m = ms / 60_000
        return if (m >= 60) "${m / 60}h ${m % 60}m" else if (m > 0) "${m}m" else "${ms / 1000}s"
    }
}
