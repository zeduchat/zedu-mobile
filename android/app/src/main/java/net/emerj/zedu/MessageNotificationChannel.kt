package net.emerj.zedu

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

object MessageNotificationChannel {
    // Must match AndroidMessageChannelID in the backend's firebase push package.
    const val CHANNEL_ID = "zedu_messages"

    fun ensure(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (notificationManager.getNotificationChannel(CHANNEL_ID) != null) {
            return
        }

        val channel = NotificationChannel(
            CHANNEL_ID,
            "Messages",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "New messages, mentions and replies"
        }
        notificationManager.createNotificationChannel(channel)
    }
}
