package net.emerj.zedu.calloverlay

import android.content.Intent
import android.graphics.PixelFormat
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import net.emerj.zedu.R
import kotlin.math.abs

class CallOverlayModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "CallOverlay"
        const val EVENT_ACTION = "CallOverlayAction"
        private const val ACTION_EXPAND = "expand"
        private const val ACTION_END_CALL = "endCall"
        private const val ACTION_TOGGLE_MIC = "toggleMic"
        private const val ACTION_TOGGLE_EMOJI = "toggleEmoji"
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var layoutParams: WindowManager.LayoutParams? = null
    private var micButton: ImageButton? = null

    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var isDragging = false

    override fun getName(): String = NAME

    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        promise.resolve(Settings.canDrawOverlays(reactContext))
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (Settings.canDrawOverlays(reactContext)) {
                promise.resolve(true)
                return
            }

            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactContext.packageName}")
            ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

            reactContext.startActivity(intent)
            promise.resolve(false)
        } catch (error: Exception) {
            promise.reject("OVERLAY_PERMISSION_ERROR", error.message, error)
        }
    }

    @ReactMethod
    fun showOverlay(title: String, isMuted: Boolean, promise: Promise) {
        reactContext.runOnUiQueueThread {
            try {
                if (!Settings.canDrawOverlays(reactContext)) {
                    promise.reject("OVERLAY_PERMISSION_DENIED", "Overlay permission not granted")
                    return@runOnUiQueueThread
                }

                if (overlayView != null) {
                    updateMicState(isMuted)
                    promise.resolve(true)
                    return@runOnUiQueueThread
                }

                val inflater = LayoutInflater.from(reactContext)
                val view = inflater.inflate(R.layout.call_overlay_widget, null)
                val titleView = view.findViewById<TextView>(R.id.overlay_title)
                val header = view.findViewById<View>(R.id.overlay_header)
                val emojiButton = view.findViewById<TextView>(R.id.btn_emoji)
                val endCallButton = view.findViewById<ImageButton>(R.id.btn_end_call)

                titleView.text = if (title.isBlank()) "Buzz call" else title
                micButton = view.findViewById(R.id.btn_mic)
                updateMicState(isMuted)

                emojiButton.setOnClickListener { sendAction(ACTION_TOGGLE_EMOJI) }
                micButton?.setOnClickListener { sendAction(ACTION_TOGGLE_MIC) }
                endCallButton.setOnClickListener { sendAction(ACTION_END_CALL) }

                header.setOnTouchListener(createHeaderTouchListener())

                val wm = reactContext.getSystemService(WindowManager::class.java)
                val params = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    overlayWindowType(),
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                    PixelFormat.TRANSLUCENT
                ).apply {
                    gravity = Gravity.TOP or Gravity.START
                    x = 24
                    y = 180
                }

                wm.addView(view, params)

                windowManager = wm
                overlayView = view
                layoutParams = params

                promise.resolve(true)
            } catch (error: Exception) {
                promise.reject("SHOW_OVERLAY_ERROR", error.message, error)
            }
        }
    }

    @ReactMethod
    fun hideOverlay(promise: Promise) {
        reactContext.runOnUiQueueThread {
            try {
                removeOverlayView()
                promise.resolve(true)
            } catch (error: Exception) {
                promise.reject("HIDE_OVERLAY_ERROR", error.message, error)
            }
        }
    }

    @ReactMethod
    fun updateMicState(isMuted: Boolean) {
        reactContext.runOnUiQueueThread {
            micButton?.setBackgroundResource(
                if (isMuted) R.drawable.call_overlay_button_bg_active
                else R.drawable.call_overlay_button_bg
            )
            micButton?.setImageResource(
                if (isMuted) R.drawable.ic_call_overlay_mic_off
                else R.drawable.ic_call_overlay_mic
            )
            micButton?.imageTintList = null
        }
    }

    @ReactMethod
    fun bringAppToForeground(promise: Promise) {
        try {
            val intent = reactContext.packageManager
                .getLaunchIntentForPackage(reactContext.packageName)
                ?.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP or
                        Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                )

            if (intent != null) {
                reactContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.reject("FOREGROUND_ERROR", "Unable to launch app")
            }
        } catch (error: Exception) {
            promise.reject("FOREGROUND_ERROR", error.message, error)
        }
    }

    private fun overlayWindowType(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }
    }

    private fun createHeaderTouchListener(): View.OnTouchListener {
        return View.OnTouchListener { _, event ->
            val params = layoutParams ?: return@OnTouchListener false
            val view = overlayView ?: return@OnTouchListener false

            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    isDragging = false
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }

                MotionEvent.ACTION_MOVE -> {
                    val deltaX = (event.rawX - initialTouchX).toInt()
                    val deltaY = (event.rawY - initialTouchY).toInt()

                    if (abs(deltaX) > 8 || abs(deltaY) > 8) {
                        isDragging = true
                    }

                    params.x = initialX + deltaX
                    params.y = initialY + deltaY
                    windowManager?.updateViewLayout(view, params)
                    true
                }

                MotionEvent.ACTION_UP -> {
                    if (!isDragging) {
                        sendAction(ACTION_EXPAND)
                    }
                    true
                }

                else -> false
            }
        }
    }

    private fun sendAction(action: String) {
        val payload = Arguments.createMap().apply {
            putString("action", action)
        }

        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_ACTION, payload)
    }

    private fun removeOverlayView() {
        val view = overlayView
        val wm = windowManager

        if (view != null && wm != null) {
            try {
                wm.removeView(view)
            } catch (_: Exception) {
                // View may already be detached.
            }
        }

        overlayView = null
        windowManager = null
        layoutParams = null
        micButton = null
    }

    override fun invalidate() {
        removeOverlayView()
        super.invalidate()
    }
}
