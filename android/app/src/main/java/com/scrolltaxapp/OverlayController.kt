package com.scrolltaxapp

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

/** Brain + count pill pinned to the top of the screen. Never intercepts touches. */
class OverlayController(private val ctx: Context) {
    private val wm = ctx.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var root: LinearLayout? = null
    private var label: TextView? = null

    fun show(count: Int) {
        if (!Settings.canDrawOverlays(ctx)) return
        if (root == null) build()
        label?.text = count.toString()
    }

    fun hide() {
        root?.let { runCatching { wm.removeView(it) } }
        root = null
        label = null
    }

    private fun dp(v: Int) = (v * ctx.resources.displayMetrics.density).toInt()

    private fun build() {
        val icon = ImageView(ctx).apply { setImageResource(R.drawable.ic_brain) }
        val text = TextView(ctx).apply {
            setTextColor(Color.WHITE)
            textSize = 15f
            setPadding(dp(6), 0, 0, 0)
        }
        val pill = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(10), dp(5), dp(12), dp(5))
            background = GradientDrawable().apply {
                setColor(Color.argb(210, 20, 20, 24))
                cornerRadius = dp(20).toFloat()
            }
            addView(icon, LinearLayout.LayoutParams(dp(20), dp(20)))
            addView(text)
        }
        val lp = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = statusBarHeight() + dp(4)
        }
        runCatching { wm.addView(pill, lp) }.onSuccess {
            root = pill
            label = text
        }
    }

    private fun statusBarHeight(): Int {
        val id = ctx.resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (id > 0) ctx.resources.getDimensionPixelSize(id) else dp(24)
    }
}
