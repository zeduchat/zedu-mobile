import Foundation
import React

@objc(CallOverlay)
class CallOverlayModule: RCTEventEmitter {
  private static let eventName = "CallOverlayAction"

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    [Self.eventName]
  }

  override init() {
    super.init()
    CallPiPManager.shared.setActionHandler { [weak self] action, extras in
      self?.sendAction(action, extras: extras)
    }

    let center = NotificationCenter.default
    center.addObserver(
      self,
      selector: #selector(handleOngoingCallKitEnd),
      name: .ongoingCallKitDidEnd,
      object: nil
    )
    center.addObserver(
      self,
      selector: #selector(handleOngoingCallKitMute(_:)),
      name: .ongoingCallKitDidToggleMute,
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  @objc
  func syncOngoingCallCallKit(
    _ buzzCode: String,
    title: String,
    isActive: Bool,
    alternateBuzzId: String?
  ) {
    if isActive {
      IncomingCallCallKitManager.shared.reportOngoingCall(buzzCode: buzzCode, title: title)
      return
    }

    let normalizedAlternateBuzzId = alternateBuzzId?
      .trimmingCharacters(in: .whitespacesAndNewlines)
    IncomingCallCallKitManager.shared.endOngoingCall(
      buzzCode: buzzCode,
      alternateBuzzId: normalizedAlternateBuzzId?.isEmpty == false ? normalizedAlternateBuzzId : nil
    )
    IncomingCallCallKitManager.shared.endAllCalls()
    CallPiPManager.shared.teardown()
    IncomingCallCallKitManager.shared.deactivateCallAudioSession()
  }

  @objc private func handleOngoingCallKitEnd() {
    sendAction("endCall", extras: ["handledNatively": true])
  }

  @objc private func handleOngoingCallKitMute(_ notification: Notification) {
    guard let isMuted = notification.userInfo?["isMuted"] as? Bool else { return }
    sendAction("toggleMic", extras: [
      "handledNatively": true,
      "isMuted": isMuted,
    ])
  }

  @objc
  func canDrawOverlays(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(CallPiPManager.shared.isSupported())
  }

  @objc
  func requestOverlayPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(true)
  }

  @objc
  func prepareOverlay(
    _ title: String,
    isMuted: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard CallPiPManager.shared.isSupported() else {
      reject("PIP_NOT_SUPPORTED", "Picture in Picture is not supported on this device", nil)
      return
    }

    CallPiPManager.shared.prepare(title: title, isMuted: isMuted)
    resolve(true)
  }

  @objc
  func showOverlay(
    _ title: String,
    isMuted: Bool,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard CallPiPManager.shared.isSupported() else {
      reject("PIP_NOT_SUPPORTED", "Picture in Picture is not supported on this device", nil)
      return
    }

    CallPiPManager.shared.show(title: title, isMuted: isMuted)
    resolve(true)
  }

  @objc
  func hideOverlay(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    CallPiPManager.shared.hide()
    resolve(true)
  }

  @objc
  func dismissOverlay(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    CallPiPManager.shared.dismissOverlay()
    resolve(true)
  }

  @objc
  func updateMicState(_ isMuted: Bool) {
    CallPiPManager.shared.updateMicState(isMuted: isMuted)
  }

  @objc
  func bringAppToForeground(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      resolve(true)
    }
  }

  @objc
  func stopScreenBroadcast() {
    CFNotificationCenterPostNotification(
      CFNotificationCenterGetDarwinNotifyCenter(),
      CFNotificationName("net.emerj.zedu.stop_screen_broadcast" as CFString),
      nil,
      nil,
      true
    )
  }

  private func sendAction(_ action: String, extras: [String: Any] = [:]) {
    var body: [String: Any] = ["action": action]
    extras.forEach { body[$0.key] = $0.value }
    sendEvent(withName: Self.eventName, body: body)
  }
}
