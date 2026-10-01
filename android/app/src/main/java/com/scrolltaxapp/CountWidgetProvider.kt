package com.scrolltaxapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews

class CountWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(ctx: Context, mgr: AppWidgetManager, ids: IntArray) = update(ctx)

    companion object {
        /** Refreshes every placed widget with today's numbers. Cheap; call freely. */
        fun update(ctx: Context) {
            val mgr = AppWidgetManager.getInstance(ctx)
            val ids = mgr.getAppWidgetIds(ComponentName(ctx, CountWidgetProvider::class.java))
            if (ids.isEmpty()) return
            val (count, ms) = ReelDb.get(ctx).today()
            val open = PendingIntent.getActivity(
                ctx, 0, ctx.packageManager.getLaunchIntentForPackage(ctx.packageName),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
            val views = RemoteViews(ctx.packageName, R.layout.widget_count).apply {
                setTextViewText(R.id.widget_count, count.toString())
                setTextViewText(R.id.widget_label, "reels today")
                setTextViewText(R.id.widget_time, Strings.formatDuration(ms))
                setOnClickPendingIntent(R.id.widget_root, open)
            }
            mgr.updateAppWidget(ids, views)
        }
    }
}
