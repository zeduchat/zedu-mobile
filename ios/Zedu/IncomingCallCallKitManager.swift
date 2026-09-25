import AVFoundation
import CallKit
import Foundation
import UIKit

final class IncomingCallCallKitManager: NSObject {
  static let shared = IncomingCallCallKitManager()

  private let provider: CXProvider
  private let callController = CXCallController()
  private var activeCalls: [UUID: String] = [:]
  private var buzzIdToUUID: [String: UUID] = [:]
  private var ongoingCalls: Set<UUID> = []

  var onAnswer: ((String) -> Void)?
  var onEnd: ((String) -> Void)?

  private override init() {
    let configuration = CXProviderConfiguration(localizedName: "Zedu")
    configuration.supportsVideo = true
    configuration.maximumCallsPerCallGroup = 1
    configuration.maximumCallGroups = 1
    configuration.supportedHandleTypes = [.generic]
    configuration.includesCallsInRecents = false
    if let icon = UIImage(named: "AppIcon") {
      configuration.iconTemplateImageData = icon.pngData()
    }

    provider = CXProvider(configuration: configuration)
    super.init()
    provider.setDelegate(self, queue: nil)
  }

  func reportIncomingCall(buzzId: String, callerName: String, completion: ((Bool) -> Void)? = nil) {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedBuzzId.isEmpty else {
      completion?(false)
      return
    }

    if let existingUUID = buzzIdToUUID[normalizedBuzzId], isOngoingCall(existingUUID) {
      completion?(true)
      return
    }

    if let existingUUID = buzzIdToUUID[normalizedBuzzId] {
      endIncomingCallQuietly(uuid: existingUUID)
    }

    let callUUID = UUID()
    activeCalls[callUUID] = normalizedBuzzId
    buzzIdToUUID[normalizedBuzzId] = callUUID

    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .generic, value: normalizedBuzzId)
    update.localizedCallerName = callerName.isEmpty ? "Incoming call" : callerName
    update.hasVideo = true
    update.supportsDTMF = false
    update.supportsHolding = false
    update.supportsGrouping = false
    update.supportsUngrouping = false

    let reportBlock = {
      self.provider.reportNewIncomingCall(with: callUUID, update: update) { error in
        if let error {
          NSLog("[IncomingCall] CallKit report failed for buzzId=%@: %@", normalizedBuzzId, error.localizedDescription)
          self.activeCalls.removeValue(forKey: callUUID)
          self.buzzIdToUUID.removeValue(forKey: normalizedBuzzId)
          completion?(false)
          return
        }

        completion?(true)
      }
    }

    if Thread.isMainThread {
      reportBlock()
    } else {
      DispatchQueue.main.async(execute: reportBlock)
    }
  }

  func prepareForNewIncomingCall() {
    endAllCalls()
  }

  func endCall(forBuzzId buzzId: String) {
    guard let uuid = buzzIdToUUID[buzzId] else {
      dismissReportedIncomingCalls()
      return
    }

    endCall(uuid: uuid, reportToSystem: true)
  }

  func endAllCalls() {
    dismissReportedIncomingCalls()
    let ongoingIds = Array(ongoingCalls)
    ongoingIds.forEach { endCall(uuid: $0, reportToSystem: true) }
    deactivateCallAudioSession()
  }

  func deactivateCallAudioSession() {
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setActive(false, options: .notifyOthersOnDeactivation)
    } catch {
      NSLog("[IncomingCall] AVAudioSession deactivation failed: %@", error.localizedDescription)
    }
  }

  func hasReportedIncomingCall(forBuzzId buzzId: String) -> Bool {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedBuzzId.isEmpty,
          let uuid = buzzIdToUUID[normalizedBuzzId] else {
      return false
    }

    return !isOngoingCall(uuid)
  }

  func dismissReportedIncomingCalls(forBuzzId buzzId: String? = nil) {
    if let buzzId,
       !buzzId.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
       let uuid = buzzIdToUUID[buzzId],
       !isOngoingCall(uuid) {
      endIncomingCallQuietly(uuid: uuid)
      return
    }

    activeCalls.keys.forEach { uuid in
      guard !isOngoingCall(uuid) else { return }
      endIncomingCallQuietly(uuid: uuid)
    }
  }

  func markAnsweredIncomingCallConnected(forBuzzId buzzId: String) {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedBuzzId.isEmpty,
          let uuid = buzzIdToUUID[normalizedBuzzId] else {
      return
    }

    ongoingCalls.insert(uuid)
  }

  func reportOngoingCall(buzzCode: String, title: String) {
    let normalizedBuzzCode = buzzCode.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedBuzzCode.isEmpty else { return }

    if let existingUUID = buzzIdToUUID[normalizedBuzzCode] {
      ongoingCalls.insert(existingUUID)
      return
    }

    let callUUID = UUID()
    activeCalls[callUUID] = normalizedBuzzCode
    buzzIdToUUID[normalizedBuzzCode] = callUUID
    ongoingCalls.insert(callUUID)

    let handle = CXHandle(type: .generic, value: normalizedBuzzCode)
    let startAction = CXStartCallAction(call: callUUID, handle: handle)
    startAction.isVideo = true

    let transaction = CXTransaction(action: startAction)
    callController.request(transaction) { [weak self] error in
      guard let self, error == nil else { return }

      DispatchQueue.main.async {
        self.provider.reportOutgoingCall(with: callUUID, connectedAt: Date())
      }
    }
  }

  func endOngoingCall(buzzCode: String, alternateBuzzId: String? = nil) {
    let candidateKeys = [buzzCode, alternateBuzzId ?? ""]
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .filter { !$0.isEmpty }

    for key in candidateKeys {
      guard let uuid = buzzIdToUUID[key] else { continue }
      ongoingCalls.remove(uuid)
      endCall(uuid: uuid, reportToSystem: true)
      return
    }

    let ongoingIds = Array(ongoingCalls)
    ongoingIds.forEach { endCall(uuid: $0, reportToSystem: true) }
    deactivateCallAudioSession()
  }

  private func endCall(uuid: UUID, reportToSystem: Bool) {
    if reportToSystem {
      provider.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    }

    let endCallAction = CXEndCallAction(call: uuid)
    let transaction = CXTransaction(action: endCallAction)
    callController.request(transaction) { _ in
      self.cleanup(uuid: uuid)
    }
  }

  private func endIncomingCallQuietly(uuid: UUID) {
    guard activeCalls[uuid] != nil else { return }
    provider.reportCall(with: uuid, endedAt: Date(), reason: .remoteEnded)
    cleanup(uuid: uuid)
    IncomingCallRingingController.shared.stop()
  }

  private func cleanup(uuid: UUID) {
    ongoingCalls.remove(uuid)
    if let buzzId = activeCalls.removeValue(forKey: uuid) {
      buzzIdToUUID.removeValue(forKey: buzzId)
    }
  }

  private func isOngoingCall(_ uuid: UUID) -> Bool {
    ongoingCalls.contains(uuid)
  }
}

extension IncomingCallCallKitManager: CXProviderDelegate {
  func providerDidReset(_ provider: CXProvider) {
    activeCalls.removeAll()
    buzzIdToUUID.removeAll()
    ongoingCalls.removeAll()
    IncomingCallRingingController.shared.stop()
  }

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    var backgroundTask: UIBackgroundTaskIdentifier = .invalid
    backgroundTask = UIApplication.shared.beginBackgroundTask {
      if backgroundTask != .invalid {
        UIApplication.shared.endBackgroundTask(backgroundTask)
        backgroundTask = .invalid
      }
    }

    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(
        .playAndRecord,
        mode: .voiceChat,
        options: [.allowBluetooth, .defaultToSpeaker]
      )
      try session.setActive(true)
    } catch {
      NSLog("[IncomingCall] AVAudioSession setup on answer failed: %@", error.localizedDescription)
    }

    if let buzzId = activeCalls[action.callUUID] {
      IncomingCallLaunchStore.updateAction(IncomingCallLaunchStore.actionAccept)
      onAnswer?(buzzId)
    }
    IncomingCallRingingController.shared.stop()
    action.fulfill()

    DispatchQueue.main.asyncAfter(deadline: .now() + 45) {
      if backgroundTask != .invalid {
        UIApplication.shared.endBackgroundTask(backgroundTask)
      }
    }
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    let callUUID = action.callUUID
    let isOngoing = isOngoingCall(callUUID)

    var backgroundTask: UIBackgroundTaskIdentifier = .invalid
    if !isOngoing {
      backgroundTask = UIApplication.shared.beginBackgroundTask {
        if backgroundTask != .invalid {
          UIApplication.shared.endBackgroundTask(backgroundTask)
          backgroundTask = .invalid
        }
      }
    }

    if isOngoing {
      CallOverlayAgoraBridge.shared().leaveCallMedia()
      CallPiPManager.shared.endCallFromSystemControls()
      NotificationCenter.default.post(name: .ongoingCallKitDidEnd, object: nil)
      cleanup(uuid: callUUID)
      deactivateCallAudioSession()
      action.fulfill()
      return
    }

    if let buzzId = activeCalls[callUUID] {
      IncomingCallLaunchStore.updateAction(IncomingCallLaunchStore.actionDecline)
      onEnd?(buzzId)
    }
    cleanup(uuid: callUUID)
    IncomingCallRingingController.shared.stop()
    action.fulfill()

    if backgroundTask != .invalid {
      DispatchQueue.main.asyncAfter(deadline: .now() + 30) {
        if backgroundTask != .invalid {
          UIApplication.shared.endBackgroundTask(backgroundTask)
        }
      }
    }
  }

  func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
    guard isOngoingCall(action.callUUID) else {
      action.fulfill()
      return
    }

    CallOverlayAgoraBridge.shared().applyMicMuted(action.isMuted)
    NotificationCenter.default.post(
      name: .ongoingCallKitDidToggleMute,
      object: nil,
      userInfo: ["isMuted": action.isMuted]
    )
    action.fulfill()
  }
}
