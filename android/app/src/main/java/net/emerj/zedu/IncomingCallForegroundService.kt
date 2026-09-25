package net.emerj.zedu

import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import org.json.JSONObject

class IncomingCallForegroundService : Service() {

    private val timeoutHandler = Handler(Looper.getMainLooper())
    private var timeoutRunnable: Runnable? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val callerName = intent?.getStringExtra(EXTRA_CALLER_NAME) ?: "Incoming call"
        val payloadJson = intent?.getStringExtra(EXTRA_PAYLOAD_JSON) ?: return START_NOT_STICKY

        IncomingCallNotificationHelper.ensureChannels(this)
        IncomingCallRingingController.start(this)

        val notification = IncomingCallNotificationHelper.buildIncomingCallNotification(
            this,
            payloadJson,
            callerName,
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                IncomingCallNotificationHelper.NOTIFICATION_ID,
                notification,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL,
            )
        } else {
            startForeground(IncomingCallNotificationHelper.NOTIFICATION_ID, notification)
        }

        scheduleRingTimeout(payloadJson)

        return START_STICKY
    }

    override fun onDestroy() {
        cancelRingTimeout()
        IncomingCallRingingController.stop()
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }

    private fun scheduleRingTimeout(payloadJson: String) {
        cancelRingTimeout()

        timeoutRunnable = Runnable {
            try {
                val payload = JSONObject(payloadJson)
                IncomingCallLaunchStore.save(
                    applicationContext,
                    payload,
                    IncomingCallLaunchStore.ACTION_TIMEOUT,
                )
                IncomingCallNotificationHelper.dismiss(applicationContext)
                IncomingCallModule.emitIncomingCallEvent(
                    payload,
                    IncomingCallLaunchStore.ACTION_TIMEOUT,
                )
            } catch (_: Exception) {
                // Ignore malformed payloads.
            }
        }

        timeoutHandler.postDelayed(timeoutRunnable!!, RING_TIMEOUT_MS)
    }

    private fun cancelRingTimeout() {
        timeoutRunnable?.let { timeoutHandler.removeCallbacks(it) }
        timeoutRunnable = null
    }

    companion object {
        private const val EXTRA_CALLER_NAME = "caller_name"
        private const val EXTRA_PAYLOAD_JSON = "payload_json"
        private const val RING_TIMEOUT_MS = 60_000L

        fun start(context: Context, callerName: String, payloadJson: String) {
            val intent = Intent(context, IncomingCallForegroundService::class.java).apply {
                putExtra(EXTRA_CALLER_NAME, callerName)
                putExtra(EXTRA_PAYLOAD_JSON, payloadJson)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            IncomingCallRingingController.stop()
            context.stopService(Intent(context, IncomingCallForegroundService::class.java))
        }
    }
}
