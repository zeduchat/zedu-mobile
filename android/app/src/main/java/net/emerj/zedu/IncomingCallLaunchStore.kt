package net.emerj.zedu

import android.content.Context
import org.json.JSONObject

object IncomingCallLaunchStore {
    const val ACTION_OPEN = "open"
    const val ACTION_ACCEPT = "accept"
    const val ACTION_DECLINE = "decline"
    const val ACTION_TIMEOUT = "timeout"

    private const val PREFS_NAME = "incoming_call_launch"
    private const val KEY_PAYLOAD = "payload_json"
    private const val KEY_ACTION = "action"

    fun save(context: Context, payload: JSONObject, action: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PAYLOAD, payload.toString())
            .putString(KEY_ACTION, action)
            .apply()
    }

    fun peek(context: Context): LaunchData? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val payloadJson = prefs.getString(KEY_PAYLOAD, null) ?: return null
        val action = prefs.getString(KEY_ACTION, ACTION_OPEN) ?: ACTION_OPEN

        return try {
            val payload = JSONObject(payloadJson)
            LaunchData(
                invite = IncomingCallPayload.toInviteMap(payload),
                action = action,
            )
        } catch (_: Exception) {
            null
        }
    }

    fun clear(context: Context) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .clear()
            .apply()
    }

    data class LaunchData(
        val invite: Map<String, Any?>,
        val action: String,
    )
}
