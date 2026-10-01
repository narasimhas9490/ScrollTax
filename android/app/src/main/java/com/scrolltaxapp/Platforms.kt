package com.scrolltaxapp

/**
 * One entry per supported app. Apps rename view ids between releases, so this
 * table is the only thing to touch when a platform stops being detected.
 * [keywords] are matched (case-insensitive substring) against view ids to find
 * the short-video viewer container.
 */
data class Platform(val id: String, val pkg: String, val keywords: List<String>)

object Platforms {
    val all = listOf(
        Platform("instagram", "com.instagram.android", listOf("clips_viewer", "clips_swipe")),
        Platform("youtube", "com.google.android.youtube", listOf("reel_recycler", "reel_player_page", "shorts_")),
        Platform("facebook", "com.facebook.katana", listOf("reels_viewer", "reel_viewer", "reels_")),
        Platform("twitter", "com.twitter.android", listOf("VideoTab")),
        Platform("snapchat", "com.snapchat.android", listOf("spotlight")),
    )

    fun byPackage(pkg: String?): Platform? = all.firstOrNull { it.pkg == pkg }
}
