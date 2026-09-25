import Foundation
import React

@objc(IncomingCallIOS)
class IncomingCallModule: RCTEventEmitter {
  private static weak var sharedInstance: IncomingCallModule?
  private static var pendingIncomingEvents: [[String: Any]] = []
  private static var pendingCancelledBuzzIds: [String] = []
  private static var pendingVoipPushEvents: [[String: Any]] = []

  override init() {
    super.init()
    IncomingCallModule.sharedInstance = self
    Self.flushPendingEventsIfReady()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    [
      "IncomingDirectCallIOS",
      "IncomingDirectCallCancelled",
      "VoipPushReceived",
    ]
  }

  override func startObserving() {
    Self.flushPendingEventsIfReady()
  }

  @objc
  func getLaunchIncomingCall(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let launch = IncomingCallLaunchStore.peek() else {
      resolve(NSNull())
      return
    }

    resolve(Self.buildLaunchDictionary(launch))
  }

  @objc
  func clearLaunchIncomingCall(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    IncomingCallLaunchStore.clear()
    resolve(NSNull())
  }

  @objc
  func dismissIncomingCallNotification(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    IncomingCallCoordinator.shared.dismissIncomingCallUI()
    resolve(NSNull())
  }

  @objc
  func dismissIncomingCallPresentation(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    IncomingCallCoordinator.shared.dismissIncomingCallPresentation()
    resolve(NSNull())
  }

  @objc
  func markIncomingCallConnected(
    _ buzzId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedBuzzId.isEmpty else {
      resolve(NSNull())
      return
    }

    IncomingCallCoordinator.shared.markIncomingCallAnswered(buzzId: normalizedBuzzId)
    IncomingCallLaunchStore.markBuzzIdHandled(normalizedBuzzId)
    IncomingCallLaunchStore.clear()
    IncomingCallCallKitManager.shared.markAnsweredIncomingCallConnected(forBuzzId: normalizedBuzzId)
    resolve(NSNull())
  }

  @objc
  func activateAppForAcceptedCall(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    IncomingCallCoordinator.shared.activateAppForAcceptedCall()
    resolve(NSNull())
  }

  @objc
  func resetIncomingCallSession(
    _ buzzId: NSString?,
    resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let normalizedBuzzId = buzzId as String?
    IncomingCallCoordinator.shared.resetCallSession(
      buzzId: normalizedBuzzId?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false
        ? normalizedBuzzId
        : nil
    )
    resolve(NSNull())
  }

  @objc
  func getVoipPushToken(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(IncomingCallPushKitManager.shared.currentVoipToken() ?? NSNull())
  }

  @objc
  func getRecentVoipPushLogs(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    resolve(IncomingCallVoipPushLogger.recentLogsForJS())
  }

  @objc
  func clearRecentVoipPushLogs(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    IncomingCallVoipPushLogger.clearRecentLogs()
    resolve(NSNull())
  }

  static func emitIncomingCallEvent(invite: [String: Any], action: String) {
    let body = buildLaunchDictionary(LaunchData(invite: invite, action: action))

    DispatchQueue.main.async {
      guard let emitter = sharedInstance, emitter.bridge != nil else {
        pendingIncomingEvents.append(body)
        return
      }

      emitter.sendEvent(withName: eventIncomingCall, body: body)
    }
  }

  static func emitIncomingCallCancelled(buzzId: String) {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedBuzzId.isEmpty else { return }

    DispatchQueue.main.async {
      guard let emitter = sharedInstance, emitter.bridge != nil else {
        pendingCancelledBuzzIds.append(normalizedBuzzId)
        return
      }

      emitter.sendEvent(
        withName: eventIncomingCallCancelled,
        body: ["buzzId": normalizedBuzzId]
      )
    }
  }

  static func emitVoipPushReceived(body: [String: Any]) {
    DispatchQueue.main.async {
      pendingVoipPushEvents.append(body)

      guard let emitter = sharedInstance, emitter.bridge != nil else {
        return
      }

      emitter.sendEvent(withName: eventVoipPushReceived, body: body)
    }
  }

  private static func flushPendingEventsIfReady() {
    DispatchQueue.main.async {
      guard let emitter = sharedInstance, emitter.bridge != nil else { return }

      pendingIncomingEvents.forEach { body in
        emitter.sendEvent(withName: eventIncomingCall, body: body)
      }
      pendingIncomingEvents.removeAll()

      pendingCancelledBuzzIds.forEach { buzzId in
        emitter.sendEvent(
          withName: eventIncomingCallCancelled,
          body: ["buzzId": buzzId]
        )
      }
      pendingCancelledBuzzIds.removeAll()

      pendingVoipPushEvents.forEach { body in
        emitter.sendEvent(withName: eventVoipPushReceived, body: body)
      }
      pendingVoipPushEvents.removeAll()
    }
  }

  private static let eventIncomingCall = "IncomingDirectCallIOS"
  private static let eventIncomingCallCancelled = "IncomingDirectCallCancelled"
  private static let eventVoipPushReceived = "VoipPushReceived"

  private struct LaunchData {
    let invite: [String: Any]
    let action: String
  }

  private static func buildLaunchDictionary(_ launch: IncomingCallLaunchStore.LaunchData) -> [String: Any] {
    buildLaunchDictionary(LaunchData(invite: launch.invite, action: launch.action))
  }

  private static func buildLaunchDictionary(_ launch: LaunchData) -> [String: Any] {
    [
      "action": launch.action,
      "invite": launch.invite,
    ]
  }
}
