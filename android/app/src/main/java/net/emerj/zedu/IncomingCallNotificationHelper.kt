package net.emerj.zedu

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import org.json.JSONObject

object IncomingCallNotificationHelper {
    const val CALL_CHANNEL_ID = "incoming_direct_calls"
    const val SERVICE_CHANNEL_ID = "incoming_direct_calls_service"
    const val NOTIFICATION_ID = 91001

    const val EXTRA_INCOMING_CALL = "incoming_direct_call"
    const val EXTRA_CALL_ACTION = "incoming_call_action"

    private const val FULL_SCREEN_REQUEST_CODE = 9101
    private const val CONTENT_REQUEST_CODE = 9102
    private const val ACCEPT_REQUEST_CODE = 9103
    private const val DECLINE_REQUEST_CODE = 9104

    fun showIncomingCallNotification(context: Context, payload: JSONObject) {
        val appContext = context.applicationContext
        ensureChannels(appContext)

        val payloadJson = payload.toString()
        val callerName = payload.optString("caller_name", "Incoming call")

        IncomingCallLaunchStore.save(
            appContext,
            payload,
            IncomingCallLaunchStore.ACTION_OPEN,
        )

        IncomingCallForegroundService.start(
            appContext,
            callerName,
            payloadJson,
        )
    }

    fun buildIncomingCallNotification(
        context: Context,
        payloadJson: String,
        callerName: String,
    ): Notification {
        ensureChannels(context)

        val openIntent = buildMainActivityIntent(
            context,
            payloadJson,
            IncomingCallLaunchStore.ACTION_OPEN,
        )
        val contentIntent = buildActivityPendingIntent(
            context,
            CONTENT_REQUEST_CODE,
            openIntent,
        )
        val fullScreenIntent = buildActivityPendingIntent(
            context,
            FULL_SCREEN_REQUEST_CODE,
            openIntent,
        )
        val acceptIntent = buildActionPendingIntent(
            context,
            payloadJson,
            IncomingCallLaunchStore.ACTION_ACCEPT,
            ACCEPT_REQUEST_CODE,
        )
        val declineIntent = buildActionPendingIntent(
            context,
            payloadJson,
            IncomingCallLaunchStore.ACTION_DECLINE,
            DECLINE_REQUEST_CODE,
        )

        return NotificationCompat.Builder(context, CALL_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(callerName)
            .setContentText("Incoming call")
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setContentIntent(contentIntent)
            .setFullScreenIntent(fullScreenIntent, true)
            .addAction(0, "Decline", declineIntent)
            .addAction(0, "Accept", acceptIntent)
            .build()
    }

    @Deprecated("Use buildIncomingCallNotification for foreground service")
    fun buildServiceNotification(context: Context, callerName: String): Notification {
        return buildIncomingCallNotification(context, "{}", callerName)
    }

    fun launchIncomingCallUi(context: Context, payloadJson: String, action: String) {
        val intent = buildMainActivityIntent(context, payloadJson, action)
        context.startActivity(intent)
    }

    fun dismiss(context: Context) {
        val appContext = context.applicationContext
        val notificationManager =
            appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(NOTIFICATION_ID)
        IncomingCallForegroundService.stop(appContext)
        IncomingCallRingingController.stop()
    }

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return
        }

        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (notificationManager.getNotificationChannel(CALL_CHANNEL_ID) == null) {
            val callChannel = NotificationChannel(
                CALL_CHANNEL_ID,
                "Incoming calls",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "Incoming buzz call alerts"
                setSound(null, null)
                enableVibration(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            notificationManager.createNotificationChannel(callChannel)
        }

        if (notificationManager.getNotificationChannel(SERVICE_CHANNEL_ID) == null) {
            val serviceChannel = NotificationChannel(
                SERVICE_CHANNEL_ID,
                "Incoming call service",
                NotificationManager.IMPORTANCE_MIN,
            ).apply {
                description = "Keeps incoming call ringing active"
                setSound(null, null)
                enableVibration(false)
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(serviceChannel)
        }
    }

    private fun buildMainActivityIntent(
        context: Context,
        payloadJson: String,
        action: String,
    ): Intent {
        return Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(EXTRA_INCOMING_CALL, true)
            putExtra(EXTRA_CALL_ACTION, action)
            putExtra("payload_json", payloadJson)
        }
    }

    private fun buildActivityPendingIntent(
        context: Context,
        requestCode: Int,
        intent: Intent,
    ): PendingIntent {
        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun buildActionPendingIntent(
        context: Context,
        payloadJson: String,
        action: String,
        requestCode: Int,
    ): PendingIntent {
        val intent = Intent(context, IncomingCallActionReceiver::class.java).apply {
            putExtra(EXTRA_CALL_ACTION, action)
            putExtra("payload_json", payloadJson)
        }

        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }
}
