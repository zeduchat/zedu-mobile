package net.emerj.zedu

import android.app.KeyguardManager
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash
import org.json.JSONObject

class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "Zedu"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme)
    super.onCreate(savedInstanceState)
    handleIncomingCallIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleIncomingCallIntent(intent)
  }

  private fun handleIncomingCallIntent(intent: Intent?) {
    if (intent == null || !intent.getBooleanExtra(IncomingCallNotificationHelper.EXTRA_INCOMING_CALL, false)) {
      return
    }

    applyIncomingCallWindowFlags()

    val action = intent.getStringExtra(IncomingCallNotificationHelper.EXTRA_CALL_ACTION)
      ?: IncomingCallLaunchStore.ACTION_OPEN
    val payloadJson = intent.getStringExtra("payload_json") ?: return

    try {
      val payload = JSONObject(payloadJson)
      IncomingCallLaunchStore.save(this, payload, action)

      if (
        action == IncomingCallLaunchStore.ACTION_DECLINE ||
        action == IncomingCallLaunchStore.ACTION_ACCEPT
      ) {
        IncomingCallNotificationHelper.dismiss(this)
      }

      IncomingCallModule.emitIncomingCallEvent(payload, action)
    } catch (_: Exception) {
      // Ignore malformed payloads.
    }
  }

  private fun applyIncomingCallWindowFlags() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val keyguardManager = getSystemService(KeyguardManager::class.java)
      keyguardManager?.requestDismissKeyguard(this, null)
    }

    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O_MR1) {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
      )
    }
  }
}
