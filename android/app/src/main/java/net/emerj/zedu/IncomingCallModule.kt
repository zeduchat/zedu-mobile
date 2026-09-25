package net.emerj.zedu

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject

class IncomingCallModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    init {
        reactContext.addLifecycleEventListener(object : LifecycleEventListener {
            override fun onHostResume() {
                flushPendingEventsIfReady()
            }

            override fun onHostPause() {}

            override fun onHostDestroy() {}
        })
    }

    override fun getName(): String = "IncomingCallAndroid"

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for NativeEventEmitter on Android.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for NativeEventEmitter on Android.
    }

    @ReactMethod
    fun getLaunchIncomingCall(promise: Promise) {
        try {
            val launchData = IncomingCallLaunchStore.peek(reactApplicationContext)
            if (launchData == null) {
                promise.resolve(null)
                return
            }

            promise.resolve(buildLaunchWritableMap(launchData))
        } catch (error: Exception) {
            promise.reject("incoming_call_error", error)
        }
    }

    @ReactMethod
    fun clearLaunchIncomingCall(promise: Promise) {
        IncomingCallLaunchStore.clear(reactApplicationContext)
        promise.resolve(null)
    }

    @ReactMethod
    fun dismissIncomingCallNotification(promise: Promise) {
        IncomingCallNotificationHelper.dismiss(reactApplicationContext)
        promise.resolve(null)
    }

    companion object {
        const val EVENT_INCOMING_CALL = "IncomingDirectCallAndroid"
        const val EVENT_INCOMING_CALL_CANCELLED = "IncomingDirectCallCancelled"

        private data class PendingIncomingEvent(
            val payload: JSONObject,
            val action: String,
        )

        private var reactContextRef: ReactApplicationContext? = null
        private val pendingIncomingEvents = mutableListOf<PendingIncomingEvent>()
        private val pendingCancelledBuzzIds = mutableListOf<String>()

        fun registerContext(context: ReactApplicationContext) {
            reactContextRef = context
            flushPendingEventsIfReady()
        }

        fun emitIncomingCallEvent(payload: JSONObject, action: String) {
            val context = reactContextRef
            if (context == null || !context.hasActiveReactInstance()) {
                pendingIncomingEvents.add(PendingIncomingEvent(payload, action))
                return
            }

            emitIncomingCallEventInternal(context, payload, action)
        }

        fun emitIncomingCallCancelled(payload: JSONObject) {
            val buzzId = payload.optString("buzz_id", "")
            val context = reactContextRef
            if (context == null || !context.hasActiveReactInstance()) {
                if (buzzId.isNotEmpty()) {
                    pendingCancelledBuzzIds.add(buzzId)
                }
                return
            }

            emitIncomingCallCancelledInternal(context, buzzId)
        }

        private fun flushPendingEventsIfReady() {
            val context = reactContextRef ?: return
            if (!context.hasActiveReactInstance()) {
                return
            }

            val events = pendingIncomingEvents.toList()
            pendingIncomingEvents.clear()
            events.forEach { event ->
                emitIncomingCallEventInternal(context, event.payload, event.action)
            }

            val cancelledBuzzIds = pendingCancelledBuzzIds.toList()
            pendingCancelledBuzzIds.clear()
            cancelledBuzzIds.forEach { buzzId ->
                emitIncomingCallCancelledInternal(context, buzzId)
            }
        }

        private fun emitIncomingCallEventInternal(
            context: ReactApplicationContext,
            payload: JSONObject,
            action: String,
        ) {
            val invite = IncomingCallPayload.toInviteMap(payload)
            val params = buildLaunchWritableMap(
                IncomingCallLaunchStore.LaunchData(invite = invite, action = action),
            )

            context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_INCOMING_CALL, params)
        }

        private fun emitIncomingCallCancelledInternal(
            context: ReactApplicationContext,
            buzzId: String,
        ) {
            val params = Arguments.createMap()
            params.putString("buzzId", buzzId)

            context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(EVENT_INCOMING_CALL_CANCELLED, params)
        }

        private fun buildLaunchWritableMap(
            launchData: IncomingCallLaunchStore.LaunchData,
        ): WritableMap {
            val map = Arguments.createMap()
            map.putString("action", launchData.action)
            map.putMap("invite", toWritableMap(launchData.invite))
            return map
        }

        private fun toWritableMap(source: Map<String, Any?>): WritableMap {
            val map = Arguments.createMap()
            source.forEach { (key, value) ->
                when (value) {
                    null -> map.putNull(key)
                    is String -> map.putString(key, value)
                    is Boolean -> map.putBoolean(key, value)
                    is Int -> map.putInt(key, value)
                    is Double -> map.putDouble(key, value)
                    is Float -> map.putDouble(key, value.toDouble())
                    is Long -> map.putDouble(key, value.toDouble())
                    is List<*> -> map.putArray(key, Arguments.fromList(value))
                    is Map<*, *> -> {
                        @Suppress("UNCHECKED_CAST")
                        map.putMap(key, toWritableMap(value as Map<String, Any?>))
                    }
                    else -> map.putString(key, value.toString())
                }
            }
            return map
        }
    }
}
