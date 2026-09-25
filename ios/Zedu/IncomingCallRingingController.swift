import AudioToolbox
import AVFoundation
import Foundation

final class IncomingCallRingingController {
  static let shared = IncomingCallRingingController()

  private var player: AVAudioPlayer?
  private var vibrationTimer: Timer?

  private(set) var isRinging = false

  private init() {}

  func start() {
    stop()

    guard let url = Bundle.main.url(forResource: "incomingcall", withExtension: "mp3") else {
      startVibration()
      isRinging = true
      return
    }

    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playback, mode: .default, options: [.duckOthers, .mixWithOthers, .allowBluetooth])
      try session.setActive(true, options: [])

      let audioPlayer = try AVAudioPlayer(contentsOf: url)
      audioPlayer.numberOfLoops = -1
      audioPlayer.prepareToPlay()
      audioPlayer.play()
      player = audioPlayer
      startVibration()
      isRinging = true
    } catch {
      player = nil
      startVibration()
      isRinging = true
    }
  }

  func stopAudioOnly() {
    player?.stop()
    player = nil
  }

  func stop() {
    isRinging = false
    stopAudioOnly()
    vibrationTimer?.invalidate()
    vibrationTimer = nil

    try? AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
  }

  private func startVibration() {
    vibrationTimer?.invalidate()
    AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)

    vibrationTimer = Timer.scheduledTimer(withTimeInterval: 1.2, repeats: true) { _ in
      AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
    }

    if let vibrationTimer {
      RunLoop.main.add(vibrationTimer, forMode: .common)
    }
  }
}
