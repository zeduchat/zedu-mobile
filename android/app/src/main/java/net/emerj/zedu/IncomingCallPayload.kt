package net.emerj.zedu

import org.json.JSONArray
import org.json.JSONObject

object IncomingCallPayload {

    fun isDirectCallEvent(data: JSONObject): Boolean {
        return data.optString("event") == "direct_call_initiated"
    }

    fun isDirectCallCancelledEvent(data: JSONObject): Boolean {
        val event = data.optString("event")
        val notificationType = data.optString("notification_type")
        val joinStatus = data.optString("join_status").lowercase()

        if (
            event == "direct_call_canceled" ||
            event == "direct_call_cancelled" ||
            event == "direct_call_ended" ||
            event == "direct_call_cancel" ||
            notificationType == "direct_call_canceled" ||
            notificationType == "direct_call_cancelled" ||
            notificationType == "direct_call_ended" ||
            notificationType == "direct_call_cancel" ||
            notificationType == "buzz_ended"
        ) {
            return data.optString("buzz_id", "").isNotEmpty()
        }

        if (joinStatus in setOf("canceled", "cancelled", "cancel", "ended", "missed")) {
            return data.optString("buzz_id", "").isNotEmpty()
        }

        if (data.has("user_cancelled") || data.has("caller_cancelled")) {
            return data.optString("buzz_id", "").isNotEmpty()
        }

        return false
    }

    fun toInviteMap(data: JSONObject): Map<String, Any?> {
        val participants = parseParticipants(data.opt("participants"))
        return linkedMapOf(
            "buzz_id" to data.optString("buzz_id", ""),
            "host_id" to data.optString("host_id", data.optString("caller_id", "")),
            "caller_id" to data.optString("caller_id", data.optString("host_id", "")),
            "channel_id" to data.optString("channel_id", ""),
            "buzz_code" to data.optString("buzz_code", ""),
            "caller_name" to data.optString("caller_name", ""),
            "avatar_url" to data.optString("avatar_url", ""),
            "default_avatar_url" to data.optString("default_avatar_url", ""),
            "participants" to participants,
        )
    }

    private fun parseParticipants(raw: Any?): List<Map<String, Any?>> {
        return when (raw) {
            is JSONArray -> {
                (0 until raw.length()).mapNotNull { index ->
                    val item = raw.optJSONObject(index) ?: return@mapNotNull null
                    jsonObjectToMap(item)
                }
            }
            is String -> {
                try {
                    val parsed = JSONArray(raw)
                    parseParticipants(parsed)
                } catch (_: Exception) {
                    emptyList()
                }
            }
            else -> emptyList()
        }
    }

    private fun jsonObjectToMap(json: JSONObject): Map<String, Any?> {
        val map = linkedMapOf<String, Any?>()
        val keys = json.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            map[key] = json.opt(key)
        }
        return map
    }
}
