package com.scrolltaxapp

import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** Thin bridge: JS reads stored data (as JSON strings) and opens the permission screens. */
class ScrollTaxModule(private val rc: ReactApplicationContext) : ReactContextBaseJavaModule(rc) {
    override fun getName() = "ScrollTaxModule"

    private val db get() = ReelDb.get(rc)

    @ReactMethod
    fun getToday(p: Promise) {
        val (count, ms) = db.today()
        p.resolve("""{"count":$count,"ms":$ms}""")
    }

    @ReactMethod
    fun getDaily(fromDay: String, p: Promise) = p.resolve(db.daily(fromDay).toString())

    @ReactMethod
    fun getMonthly(p: Promise) = p.resolve(db.monthly().toString())

    @ReactMethod
    fun getReelsForDay(day: String, p: Promise) = p.resolve(db.reelsForDay(day).toString())

    @ReactMethod
    fun isOverlayGranted(p: Promise) = p.resolve(Settings.canDrawOverlays(rc))

    @ReactMethod
    fun isAccessibilityEnabled(p: Promise) {
        val enabled = Settings.Secure.getString(rc.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        val me = "${rc.packageName}/${ReelAccessibilityService::class.java.name}"
        val on = enabled != null && TextUtils.SimpleStringSplitter(':').apply { setString(enabled) }
            .any { it.equals(me, ignoreCase = true) }
        p.resolve(on)
    }

    @ReactMethod
    fun openOverlaySettings() {
        // Per-app page first: some phones (Nothing OS) show the full app list for the generic action.
        val pkg = Uri.parse("package:${rc.packageName}")
        try {
            launch(Intent("android.settings.MANAGE_APP_OVERLAY_PERMISSION", pkg))
        } catch (e: Exception) {
            launch(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, pkg))
        }
    }

    @ReactMethod
    fun openAccessibilitySettings() {
        // Jump straight to ScrollTax's own toggle; fall back to the list with ScrollTax highlighted.
        val me = ComponentName(rc, ReelAccessibilityService::class.java).flattenToString()
        val details = Intent("android.settings.ACCESSIBILITY_DETAILS_SETTINGS")
            .putExtra(Intent.EXTRA_COMPONENT_NAME, me)
        val list = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            .putExtra(":settings:fragment_args_key", me)
            .putExtra(":settings:show_fragment_args", Bundle().apply { putString(":settings:fragment_args_key", me) })
        try {
            launch(details)
        } catch (e: Exception) {
            launch(list)
        }
    }

    @ReactMethod
    fun getPref(key: String, p: Promise) = p.resolve(Strings.pref(rc, key))

    @ReactMethod
    fun setPref(key: String, value: String) = Strings.setPref(rc, key, value)

    @ReactMethod
    fun clearHistory(p: Promise) {
        db.clearAll()
        CountWidgetProvider.update(rc)
        p.resolve(true)
    }

    private fun launch(i: Intent) {
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        rc.startActivity(i)
    }
}
