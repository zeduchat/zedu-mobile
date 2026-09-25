import Foundation
import PushKit

final class IncomingCallPushKitManager: NSObject {
  static let shared = IncomingCallPushKitManager()

  private var registry: PKPushRegistry?
  private var cachedVoipToken: String?

  private override init() {
    super.init()
    configureRegistry()
  }

  func configure() {
    configureRegistry()
  }

  func currentVoipToken() -> String? {
    if let cachedVoipToken, !cachedVoipToken.isEmpty {
      return cachedVoipToken
    }

    return IncomingCallLaunchStore.getVoipPushToken()
  }

  private func configureRegistry() {
    guard registry == nil else { return }

    let pushRegistry = PKPushRegistry(queue: DispatchQueue.main)
    pushRegistry.delegate = self
    pushRegistry.desiredPushTypes = [.voIP]
    registry = pushRegistry
  }

  private func cacheVoipToken(_ token: String) {
    cachedVoipToken = token.isEmpty ? nil : token
    IncomingCallLaunchStore.saveVoipPushToken(token)

    if !token.isEmpty {
      NSLog("[IncomingCall] VoIP token updated (%@...)", String(token.prefix(16)))
    }
  }
}

extension IncomingCallPushKitManager: PKPushRegistryDelegate {
  func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
    let token = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
    cacheVoipToken(token)
  }

  func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    cacheVoipToken("")
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    let userInfo = payload.dictionaryPayload

    if let additionalData = IncomingCallPayload.extractAdditionalData(from: userInfo) {
      if IncomingCallPayload.isDirectCallCancelledEvent(additionalData) {
        IncomingCallVoipPushLogger.logReceived(
          kind: .directCallCancel,
          rawPayload: userInfo,
          parsedPayload: additionalData
        )
        IncomingCallCoordinator.shared.handleCancelledPayloadFromPush(additionalData)
        completion()
        return
      }

      if IncomingCallPayload.isDirectCallAcceptedElsewhereEvent(additionalData) {
        IncomingCallVoipPushLogger.logReceived(
          kind: .directCallCancel,
          rawPayload: userInfo,
          parsedPayload: additionalData
        )
        IncomingCallCoordinator.shared.handleAnsweredElsewherePayloadFromPush(additionalData)
        completion()
        return
      }

      if IncomingCallPayload.isDirectCallEvent(additionalData) {
        IncomingCallVoipPushLogger.logReceived(
          kind: .directCall,
          rawPayload: userInfo,
          parsedPayload: additionalData
        )
        IncomingCallCoordinator.shared.presentIncomingCallFromPush(
          additionalData,
          action: IncomingCallLaunchStore.actionOpen,
          pushCompletion: completion
        )
        return
      }
    }

    IncomingCallVoipPushLogger.logReceived(
      kind: .unrecognized,
      rawPayload: userInfo,
      parsedPayload: nil
    )
    completion()
  }
}
