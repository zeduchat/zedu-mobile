package net.emerj.zedu

import androidx.annotation.Keep
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ProcessLifecycleOwner
import com.onesignal.notifications.INotificationReceivedEvent
import com.onesignal.notifications.INotificationServiceExtension

@Keep
class DirectCallNotificationServiceExtension : INotificationServiceExtension {

    override fun onNotificationReceived(event: INotificationReceivedEvent) {
        val additionalData = event.notification.additionalData ?: return

        if (IncomingCallPayload.isDirectCallCancelledEvent(additionalData)) {
            event.preventDefault()
            IncomingCallLaunchStore.clear(event.context)
            IncomingCallNotificationHelper.dismiss(event.context)
            IncomingCallModule.emitIncomingCallCancelled(additionalData)
            return
        }

        if (!IncomingCallPayload.isDirectCallEvent(additionalData)) {
            return
        }

        val isAppInForeground = ProcessLifecycleOwner.get()
            .lifecycle
            .currentState
            .isAtLeast(Lifecycle.State.RESUMED)

        if (isAppInForeground) {
            return
        }

        event.preventDefault()

        IncomingCallLaunchStore.save(event.context, additionalData, IncomingCallLaunchStore.ACTION_OPEN)
        IncomingCallNotificationHelper.showIncomingCallNotification(event.context, additionalData)
    }
}
