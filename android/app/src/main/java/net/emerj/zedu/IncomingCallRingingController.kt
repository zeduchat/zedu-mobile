package net.emerj.zedu

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

object IncomingCallRingingController {
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null

    private val vibrationPattern = longArrayOf(0, 900, 500, 900)

    fun start(context: Context) {
        stop()
        startRingtone(context)
        startVibration(context)
    }

    fun stop() {
        try {
            mediaPlayer?.stop()
        } catch (_: Exception) {
        }
        mediaPlayer?.release()
        mediaPlayer = null

        vibrator?.cancel()
        vibrator = null
    }

    private fun startRingtone(context: Context) {
        val appContext = context.applicationContext
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build()

        val customRingtoneUri = Uri.parse(
            "android.resource://${appContext.packageName}/${R.raw.incomingcall}",
        )

        val player = try {
            MediaPlayer().apply {
                setAudioAttributes(audioAttributes)
                setDataSource(appContext, customRingtoneUri)
                isLooping = true
                setVolume(1f, 1f)
                prepare()
            }
        } catch (_: Exception) {
            null
        } ?: createFallbackRingtonePlayer(appContext, audioAttributes) ?: return

        try {
            player.start()
            mediaPlayer = player
        } catch (_: Exception) {
            player.release()
        }
    }

    private fun createFallbackRingtonePlayer(
        context: Context,
        audioAttributes: AudioAttributes,
    ): MediaPlayer? {
        val defaultUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            ?: return null

        return try {
            MediaPlayer().apply {
                setAudioAttributes(audioAttributes)
                setDataSource(context, defaultUri)
                isLooping = true
                setVolume(1f, 1f)
                prepare()
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun startVibration(context: Context) {
        val appContext = context.applicationContext
        val activeVibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val manager = appContext.getSystemService(VibratorManager::class.java)
            manager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            appContext.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        } ?: return

        vibrator = activeVibrator

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            activeVibrator.vibrate(
                VibrationEffect.createWaveform(vibrationPattern, 0),
            )
        } else {
            @Suppress("DEPRECATION")
            activeVibrator.vibrate(vibrationPattern, 0)
        }
    }
}
