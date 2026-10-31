package net.emerj.zedu

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build

object FirebasePushChannels {
    const val MESSAGE_CHANNEL_ID = "zedu_messages"

    fun ensure(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        val channel = NotificationChannel(
            MESSAGE_CHANNEL_ID,
            "Messages",
            NotificationManager.IMPORTANCE_HIGH,
        )
        channel.description = "Chat and organisation notifications"
        manager.createNotificationChannel(channel)
    }
}
