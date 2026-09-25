package net.emerj.zedu

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import org.json.JSONObject

class IncomingCallActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent == null) return

        val action = intent.getStringExtra(IncomingCallNotificationHelper.EXTRA_CALL_ACTION)
            ?: IncomingCallLaunchStore.ACTION_DECLINE
        val payloadJson = intent.getStringExtra("payload_json") ?: return

        try {
            val payload = JSONObject(payloadJson)
            IncomingCallLaunchStore.save(context, payload, action)
        } catch (_: Exception) {
            return
        }

        IncomingCallNotificationHelper.dismiss(context)

        if (action == IncomingCallLaunchStore.ACTION_DECLINE) {
            IncomingCallModule.emitIncomingCallEvent(
                JSONObject(payloadJson),
                IncomingCallLaunchStore.ACTION_DECLINE,
            )
            return
        }

        val activityIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra(IncomingCallNotificationHelper.EXTRA_INCOMING_CALL, true)
            putExtra(IncomingCallNotificationHelper.EXTRA_CALL_ACTION, action)
            putExtra("payload_json", payloadJson)
        }
        context.startActivity(activityIntent)
    }
}
