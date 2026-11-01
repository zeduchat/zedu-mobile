package net.emerj.zedu

import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ProcessLifecycleOwner
import com.google.firebase.messaging.RemoteMessage
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService
import org.json.JSONObject

/**
 * Replaces React Native Firebase's messaging service so direct-call pushes can ring natively
 * while the app is backgrounded or killed. React Native Firebase's own broadcast receiver still
 * forwards every message to JS, so the JS handlers must ignore cancellations handled here.
 */
class ZeduFirebaseMessagingService : ReactNativeFirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val data = JSONObject(remoteMessage.data as Map<*, *>)

        if (IncomingCallPayload.isDirectCallCancelledEvent(data)) {
            IncomingCallLaunchStore.clear(this)
            IncomingCallNotificationHelper.dismiss(this)
            IncomingCallModule.emitIncomingCallCancelled(data)
            return
        }

        if (IncomingCallPayload.isDirectCallEvent(data) && !isAppInForeground()) {
            IncomingCallLaunchStore.save(this, data, IncomingCallLaunchStore.ACTION_OPEN)
            IncomingCallNotificationHelper.showIncomingCallNotification(this, data)
            return
        }

        super.onMessageReceived(remoteMessage)
    }

    private fun isAppInForeground(): Boolean {
        return ProcessLifecycleOwner.get()
            .lifecycle
            .currentState
            .isAtLeast(Lifecycle.State.RESUMED)
    }
}
