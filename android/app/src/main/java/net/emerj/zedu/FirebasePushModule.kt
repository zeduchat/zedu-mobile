package net.emerj.zedu

import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject

class FirebasePushModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for NativeEventEmitter on Android.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for NativeEventEmitter on Android.
    }

    @ReactMethod
    fun getToken(promise: Promise) {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful || task.result.isNullOrBlank()) {
                promise.reject("fcm_token", task.exception ?: Exception("Firebase did not return a token"))
                return@addOnCompleteListener
            }
            promise.resolve(task.result)
        }
    }

    @ReactMethod
    fun deleteToken(promise: Promise) {
        FirebaseMessaging.getInstance().deleteToken().addOnCompleteListener {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun getInitialNotification(promise: Promise) {
        val pending = pendingOpened
        pendingOpened = null
        if (pending == null) {
            promise.resolve(null)
            return
        }
        promise.resolve(jsonToWritableMap(pending))
    }

    companion object {
        const val NAME = "FirebasePushAndroid"
        const val EVENT_TOKEN = "FirebasePushToken"
        const val EVENT_MESSAGE = "FirebasePushMessage"
        const val EVENT_OPENED = "FirebasePushOpened"

        private var reactContextRef: ReactApplicationContext? = null
        private var pendingOpened: JSONObject? = null

        fun registerContext(context: ReactApplicationContext) {
            reactContextRef = context
        }

        fun emitToken(token: String) {
            emit(EVENT_TOKEN, Arguments.createMap().apply { putString("token", token) })
        }

        fun emitMessage(data: JSONObject) {
            emit(EVENT_MESSAGE, jsonToWritableMap(data))
        }

        fun captureOpenedNotification(intent: Intent?) {
            val data = extractPushData(intent) ?: return
            val context = reactContextRef
            if (context != null && context.hasActiveReactInstance()) {
                pendingOpened = null
                emit(EVENT_OPENED, jsonToWritableMap(data))
                return
            }
            pendingOpened = data
        }

        private fun extractPushData(intent: Intent?): JSONObject? {
            if (intent == null) return null
            if (intent.getBooleanExtra(IncomingCallNotificationHelper.EXTRA_INCOMING_CALL, false)) {
                return null
            }

            val extras = intent.extras ?: return null
            val data = JSONObject()
            for (key in extras.keySet()) {
                if (key.startsWith("google.") || key.startsWith("gcm.") || key == "from") {
                    continue
                }
                val value = extras.get(key)
                if (value is String && value.isNotEmpty()) {
                    data.put(key, value)
                }
            }

            if (!data.has("notification_type") && !data.has("event") && !data.has("channel_id")) {
                return null
            }
            return data
        }

        private fun emit(eventName: String, payload: WritableMap) {
            val context = reactContextRef ?: return
            if (!context.hasActiveReactInstance()) {
                return
            }
            context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, payload)
        }

        private fun jsonToWritableMap(json: JSONObject): WritableMap {
            val map = Arguments.createMap()
            val keys = json.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                map.putString(key, json.optString(key, ""))
            }
            return map
        }
    }
}
