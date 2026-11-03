package net.emerj.zedu

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ProcessLifecycleOwner
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONObject

class ZeduFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        FirebasePushModule.emitToken(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = toPayload(message)
        val foreground = isAppInForeground()

        if (IncomingCallPayload.isDirectCallCancelledEvent(data)) {
            IncomingCallLaunchStore.clear(this)
            IncomingCallNotificationHelper.dismiss(this)
            IncomingCallModule.emitIncomingCallCancelled(data)
            return
        }

        if (IncomingCallPayload.isDirectCallEvent(data)) {
            if (foreground) {
                FirebasePushModule.emitMessage(data)
                return
            }

            IncomingCallLaunchStore.save(this, data, IncomingCallLaunchStore.ACTION_OPEN)
            IncomingCallNotificationHelper.showIncomingCallNotification(this, data)
            return
        }

        if (foreground) {
            FirebasePushModule.emitMessage(data)
            return
        }

        showBackgroundNotification(data)
    }

    private fun showBackgroundNotification(data: JSONObject) {
        FirebasePushChannels.ensure(this)
        val title = data.optString("title", "Zedu").ifBlank { "Zedu" }
        val body = data.optString("body", data.optString("content", ""))

        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            val keys = data.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                putExtra(key, data.optString(key, ""))
            }
        }

        val requestCode = (data.optString("channel_id", title) + body).hashCode()
        val contentIntent = PendingIntent.getActivity(
            this,
            requestCode,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(this, FirebasePushChannels.MESSAGE_CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(contentIntent)
            .build()

        val manager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        manager.notify(requestCode, notification)
    }

    private fun isAppInForeground(): Boolean {
        return ProcessLifecycleOwner.get()
            .lifecycle
            .currentState
            .isAtLeast(Lifecycle.State.RESUMED)
    }

    private fun toPayload(message: RemoteMessage): JSONObject {
        val data = JSONObject()
        for ((key, value) in message.data) {
            data.put(key, value)
        }

        val title = message.notification?.title ?: data.optString("title", "")
        val body = message.notification?.body ?: data.optString("body", "")
        if (title.isNotEmpty()) {
            data.put("title", title)
        }
        if (body.isNotEmpty()) {
            data.put("body", body)
        }
        return data
    }
}
