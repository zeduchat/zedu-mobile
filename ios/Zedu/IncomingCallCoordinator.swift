import Foundation
import UIKit
import UserNotifications

final class IncomingCallCoordinator {
  static let shared = IncomingCallCoordinator()
  private static let incomingCallRingTimeoutSeconds: TimeInterval = 30

  private var isConfigured = false
  private var activeBuzzId: String?
  private var answeredBuzzIds: Set<String> = []
  private var ringTimeoutWorkItem: DispatchWorkItem?

  private init() {}

  func configure() {
    guard !isConfigured else { return }
    isConfigured = true

    IncomingCallNotificationManager.registerCategories()
    IncomingCallDarwinObserver.install()
    _ = IncomingCallPushKitManager.shared

    IncomingCallCallKitManager.shared.onAnswer = { [weak self] buzzId in
      self?.markIncomingCallAnswered(buzzId: buzzId)
      self?.activateApplicationForAcceptedCall()
      self?.emitStoredLaunchEvent(action: IncomingCallLaunchStore.actionAccept)
    }

    IncomingCallCallKitManager.shared.onEnd = { [weak self] buzzId in
      self?.handleIncomingCallDeclined(buzzId: buzzId)
    }
  }

  func handleRemoteNotification(
    _ userInfo: [AnyHashable: Any],
    appState: UIApplication.State
  ) {
    guard let additionalData = IncomingCallPayload.extractAdditionalData(from: userInfo) else {
      presentPendingIncomingCallIfNeeded()
      return
    }

    if IncomingCallPayload.isDirectCallCancelledEvent(additionalData) {
      handleCancelledPayload(additionalData, appState: appState)
      return
    }

    if IncomingCallPayload.isDirectCallAcceptedElsewhereEvent(additionalData) {
      handleAnsweredElsewherePayload(additionalData, appState: appState)
      return
    }

    guard IncomingCallPayload.isDirectCallEvent(additionalData) else {
      return
    }

    presentIncomingCall(additionalData, action: IncomingCallLaunchStore.actionOpen)
  }

  func handleCancelledPayloadFromPush(_ payload: [String: Any]) {
    handleCancelledPayload(payload, appState: UIApplication.shared.applicationState)
  }

  func handleAnsweredElsewherePayloadFromPush(_ payload: [String: Any]) {
    handleAnsweredElsewherePayload(payload, appState: UIApplication.shared.applicationState)
  }

  func presentIncomingCallFromPush(
    _ payload: [String: Any],
    action: String,
    pushCompletion: @escaping () -> Void
  ) {
    presentIncomingCall(payload, action: action, pushCompletion: pushCompletion)
  }

  func handleNotificationResponse(_ response: UNNotificationResponse) {
    let userInfo = response.notification.request.content.userInfo

    guard let additionalData = IncomingCallPayload.extractAdditionalData(from: userInfo) else {
      return
    }

    if IncomingCallPayload.isDirectCallCancelledEvent(additionalData) {
      handleCancelledPayload(additionalData, appState: UIApplication.shared.applicationState)
      return
    }

    guard IncomingCallPayload.isDirectCallEvent(additionalData) else {
      return
    }

    let action: String
    switch response.actionIdentifier {
    case IncomingCallNotificationManager.acceptActionId:
      action = IncomingCallLaunchStore.actionAccept
    case IncomingCallNotificationManager.declineActionId:
      action = IncomingCallLaunchStore.actionDecline
    default:
      action = IncomingCallLaunchStore.actionOpen
    }

    if IncomingCallLaunchStore.peekRawPayload() == nil {
      IncomingCallLaunchStore.save(additionalData, action: action)
    } else {
      IncomingCallLaunchStore.updateAction(action)
    }

    if action == IncomingCallLaunchStore.actionOpen {
      presentIncomingCall(additionalData, action: action)
      return
    }

    emitStoredLaunchEvent(action: action)
  }

  func processPendingEvents() {
    if let buzzId = IncomingCallLaunchStore.consumePendingCancelBuzzId() {
      dismissIncomingCallUI(forBuzzId: buzzId)
      IncomingCallModule.emitIncomingCallCancelled(buzzId: buzzId)
      return
    }

    if let buzzId = IncomingCallLaunchStore.consumePendingTimeoutBuzzId() {
      replayTimedOutIncomingCall(buzzId: buzzId)
      return
    }

    if let buzzId = IncomingCallLaunchStore.consumePendingDeclineBuzzId() {
      replayDeclinedIncomingCall(buzzId: buzzId)
      return
    }

    if let launch = IncomingCallLaunchStore.peek() {
      let buzzId = stringValue(launch.invite["buzz_id"])

      if !buzzId.isEmpty, IncomingCallLaunchStore.isBuzzIdHandled(buzzId) {
        IncomingCallLaunchStore.clear()
        return
      }

      if launch.action == IncomingCallLaunchStore.actionAccept {
        activateApplicationForAcceptedCall()
        emitStoredLaunchEvent(action: launch.action)
        return
      }

      if launch.action == IncomingCallLaunchStore.actionDecline
          || launch.action == IncomingCallLaunchStore.actionTimeout {
        return
      }
    }

    presentPendingIncomingCallIfNeeded()
  }

  func dismissIncomingCallUI(forBuzzId buzzId: String? = nil) {
    ringTimeoutWorkItem?.cancel()
    ringTimeoutWorkItem = nil
    IncomingCallRingingController.shared.stop()

    if let buzzId, !buzzId.isEmpty {
      IncomingCallCallKitManager.shared.dismissReportedIncomingCalls(forBuzzId: buzzId)
      if activeBuzzId == buzzId {
        activeBuzzId = nil
      }
    } else {
      activeBuzzId = nil
      IncomingCallCallKitManager.shared.dismissReportedIncomingCalls()
    }

    IncomingCallNotificationManager.dismiss()
  }

  func dismissIncomingCallPresentation() {
    activeBuzzId = nil
    IncomingCallNotificationManager.dismiss()
    IncomingCallCallKitManager.shared.dismissReportedIncomingCalls()
  }

  func activateAppForAcceptedCall() {
    activateApplicationForAcceptedCall()
  }

  func resetCallSession(buzzId: String? = nil) {
    ringTimeoutWorkItem?.cancel()
    ringTimeoutWorkItem = nil
    activeBuzzId = nil
    IncomingCallRingingController.shared.stop()
    IncomingCallNotificationManager.dismiss()

    if let buzzId {
      let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
      if !normalizedBuzzId.isEmpty {
        answeredBuzzIds.insert(normalizedBuzzId)
        IncomingCallLaunchStore.markBuzzIdHandled(normalizedBuzzId)
      }
    } else {
      answeredBuzzIds.removeAll()
    }

    IncomingCallCallKitManager.shared.endAllCalls()
    IncomingCallLaunchStore.clear()
    CallPiPManager.shared.teardown()
  }

  func presentPendingIncomingCallIfNeeded() {
    guard let launch = IncomingCallLaunchStore.peek(),
          let payload = IncomingCallLaunchStore.peekRawPayload() else {
      return
    }

    let buzzId = stringValue(launch.invite["buzz_id"])
    guard !buzzId.isEmpty else { return }

    if launch.action == IncomingCallLaunchStore.actionDecline
        || launch.action == IncomingCallLaunchStore.actionTimeout {
      if IncomingCallLaunchStore.isBuzzIdHandled(buzzId) {
        IncomingCallLaunchStore.clear()
        return
      }

      if launch.action == IncomingCallLaunchStore.actionDecline {
        replayDeclinedIncomingCall(buzzId: buzzId)
      } else {
        replayTimedOutIncomingCall(buzzId: buzzId)
      }
      return
    }

    if launch.action == IncomingCallLaunchStore.actionAccept
        || answeredBuzzIds.contains(buzzId)
        || IncomingCallLaunchStore.isBuzzIdHandled(buzzId) {
      return
    }

    if activeBuzzId != buzzId {
      presentIncomingCall(payload, action: IncomingCallLaunchStore.actionOpen)
    }
  }

  func markIncomingCallAnswered(buzzId: String) {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedBuzzId.isEmpty else { return }

    ringTimeoutWorkItem?.cancel()
    ringTimeoutWorkItem = nil
    answeredBuzzIds.insert(normalizedBuzzId)
    IncomingCallLaunchStore.markBuzzIdHandled(normalizedBuzzId)
    activeBuzzId = nil
    IncomingCallRingingController.shared.stop()
  }

  private func markIncomingCallEnded(buzzId: String) {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedBuzzId.isEmpty else { return }

    ringTimeoutWorkItem?.cancel()
    ringTimeoutWorkItem = nil
    answeredBuzzIds.remove(normalizedBuzzId)
    if activeBuzzId == normalizedBuzzId {
      activeBuzzId = nil
    }
    IncomingCallRingingController.shared.stop()
  }

  private func handleIncomingCallDeclined(buzzId: String) {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedBuzzId.isEmpty else { return }
    guard !IncomingCallLaunchStore.isBuzzIdHandled(normalizedBuzzId) else { return }

    markIncomingCallEnded(buzzId: normalizedBuzzId)
    IncomingCallLaunchStore.markBuzzIdHandled(normalizedBuzzId)
    IncomingCallLaunchStore.updateAction(IncomingCallLaunchStore.actionDecline)
    dismissIncomingCallUI(forBuzzId: normalizedBuzzId)

    if UIApplication.shared.applicationState != .active {
      IncomingCallLaunchStore.savePendingDeclineBuzzId(normalizedBuzzId)
    }

    emitStoredLaunchEvent(action: IncomingCallLaunchStore.actionDecline)
  }

  private func replayDeclinedIncomingCall(buzzId: String) {
    guard !buzzId.isEmpty else { return }

    IncomingCallLaunchStore.markBuzzIdHandled(buzzId)

    if IncomingCallLaunchStore.peek() != nil {
      IncomingCallLaunchStore.updateAction(IncomingCallLaunchStore.actionDecline)
    }

    dismissIncomingCallUI(forBuzzId: buzzId)
    emitStoredLaunchEvent(action: IncomingCallLaunchStore.actionDecline)
  }

  private func activateApplicationForAcceptedCall() {
    DispatchQueue.main.async {
      if let appDelegate = UIApplication.shared.delegate as? AppDelegate,
         let window = appDelegate.window {
        window.makeKeyAndVisible()
      }

      if #available(iOS 13.0, *) {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        for scene in scenes where scene.activationState != .foregroundActive {
          UIApplication.shared.requestSceneSessionActivation(
            scene.session,
            userActivity: nil,
            options: nil
          ) { error in
            NSLog("[IncomingCall] scene activation failed: %@", error.localizedDescription)
          }
          break
        }
      }
    }
  }

  private func presentIncomingCall(
    _ payload: [String: Any],
    action: String,
    pushCompletion: (() -> Void)? = nil
  ) {
    let invite = IncomingCallPayload.toInviteMap(payload)
    let buzzId = stringValue(invite["buzz_id"])
    let callerName = stringValue(invite["caller_name"], fallback: "Incoming call")

    guard !buzzId.isEmpty else {
      pushCompletion?()
      return
    }

    if answeredBuzzIds.contains(buzzId)
        || IncomingCallLaunchStore.isBuzzIdHandled(buzzId)
        || action == IncomingCallLaunchStore.actionAccept
        || action == IncomingCallLaunchStore.actionDecline
        || action == IncomingCallLaunchStore.actionTimeout {
      pushCompletion?()
      return
    }

    if activeBuzzId == buzzId {
      pushCompletion?()
      return
    }

    if action == IncomingCallLaunchStore.actionOpen {
      IncomingCallCallKitManager.shared.prepareForNewIncomingCall()
    }

    activeBuzzId = buzzId
    IncomingCallLaunchStore.save(payload, action: action)
    scheduleRingTimeout(forBuzzId: buzzId)

    IncomingCallCallKitManager.shared.reportIncomingCall(
      buzzId: buzzId,
      callerName: callerName
    ) { [weak self] success in
      guard let self else {
        pushCompletion?()
        return
      }

      if success {
        IncomingCallRingingController.shared.stop()
      } else {
        IncomingCallRingingController.shared.start()
        NSLog("[IncomingCall] CallKit failed for buzzId=%@; using fallback ring", buzzId)
      }

      if action == IncomingCallLaunchStore.actionAccept
          || action == IncomingCallLaunchStore.actionDecline {
        self.emitStoredLaunchEvent(action: action)
      }

      pushCompletion?()
    }
  }

  private func scheduleRingTimeout(forBuzzId buzzId: String) {
    ringTimeoutWorkItem?.cancel()

    let workItem = DispatchWorkItem { [weak self] in
      self?.handleIncomingCallTimeout(forBuzzId: buzzId)
    }

    ringTimeoutWorkItem = workItem
    DispatchQueue.main.asyncAfter(
      deadline: .now() + Self.incomingCallRingTimeoutSeconds,
      execute: workItem
    )
  }

  private func handleIncomingCallTimeout(forBuzzId buzzId: String) {
    guard activeBuzzId == buzzId else { return }
    guard !answeredBuzzIds.contains(buzzId) else { return }
    guard !IncomingCallLaunchStore.isBuzzIdHandled(buzzId) else { return }

    ringTimeoutWorkItem = nil
    activeBuzzId = nil
    IncomingCallLaunchStore.markBuzzIdHandled(buzzId)
    IncomingCallLaunchStore.updateAction(IncomingCallLaunchStore.actionTimeout)
    dismissIncomingCallUI(forBuzzId: buzzId)

    if UIApplication.shared.applicationState != .active {
      IncomingCallLaunchStore.savePendingTimeoutBuzzId(buzzId)
    }

    emitStoredLaunchEvent(action: IncomingCallLaunchStore.actionTimeout)
  }

  private func replayTimedOutIncomingCall(buzzId: String) {
    guard !buzzId.isEmpty else { return }
    guard !answeredBuzzIds.contains(buzzId) else { return }
    guard !IncomingCallLaunchStore.isBuzzIdHandled(buzzId) else {
      IncomingCallLaunchStore.clear()
      return
    }

    if IncomingCallLaunchStore.peek() != nil {
      IncomingCallLaunchStore.updateAction(IncomingCallLaunchStore.actionTimeout)
    }

    IncomingCallLaunchStore.markBuzzIdHandled(buzzId)
    dismissIncomingCallUI(forBuzzId: buzzId)
    emitStoredLaunchEvent(action: IncomingCallLaunchStore.actionTimeout)
  }

  private func handleCancelledPayload(_ payload: [String: Any], appState: UIApplication.State) {
    let buzzId = stringValue(payload["buzz_id"])
    guard !buzzId.isEmpty else { return }

    dismissIncomingCallForBuzzId(buzzId, appState: appState)
  }

  private func handleAnsweredElsewherePayload(_ payload: [String: Any], appState: UIApplication.State) {
    let buzzId = stringValue(payload["buzz_id"])
    guard !buzzId.isEmpty else { return }

    // End audible/vibration immediately — CallKit teardown can lag behind.
    IncomingCallRingingController.shared.stop()
    dismissIncomingCallForBuzzId(buzzId, appState: appState)
  }

  private func shouldDismissIncomingCall(forBuzzId buzzId: String) -> Bool {
    if activeBuzzId == buzzId {
      return true
    }

    if IncomingCallCallKitManager.shared.hasReportedIncomingCall(forBuzzId: buzzId) {
      return true
    }

    guard let launch = IncomingCallLaunchStore.peek() else {
      return false
    }

    return stringValue(launch.invite["buzz_id"]) == buzzId
  }

  private func dismissIncomingCallForBuzzId(_ buzzId: String, appState: UIApplication.State) {
    ringTimeoutWorkItem?.cancel()
    ringTimeoutWorkItem = nil
    IncomingCallRingingController.shared.stop()
    answeredBuzzIds.insert(buzzId)
    IncomingCallLaunchStore.markBuzzIdHandled(buzzId)

    if activeBuzzId == buzzId {
      activeBuzzId = nil
    }

    dismissIncomingCallUI(forBuzzId: buzzId)
    IncomingCallLaunchStore.clear()
    IncomingCallModule.emitIncomingCallCancelled(buzzId: buzzId)

    if appState != .active {
      IncomingCallLaunchStore.savePendingCancelBuzzId(buzzId)
    }
  }

  private func emitStoredLaunchEvent(action: String) {
    guard let launch = IncomingCallLaunchStore.peek() else { return }
    IncomingCallModule.emitIncomingCallEvent(invite: launch.invite, action: action)
  }

  private func stringValue(_ value: Any?, fallback: String = "") -> String {
    if let string = value as? String {
      return string
    }

    if let number = value as? NSNumber {
      return number.stringValue
    }

    return fallback
  }
}
