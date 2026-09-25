import Foundation

enum IncomingCallLaunchStore {
  static let appGroupId = "group.net.emerj.zedu.onesignal"
  static let prefsName = "incoming_call_launch"

  static let actionOpen = "open"
  static let actionAccept = "accept"
  static let actionDecline = "decline"
  static let actionTimeout = "timeout"

  private static let payloadKey = "payload_json"
  private static let actionKey = "action"
  private static let pendingCancelBuzzIdKey = "pending_cancel_buzz_id"
  private static let pendingTimeoutBuzzIdKey = "pending_timeout_buzz_id"
  private static let pendingDeclineBuzzIdKey = "pending_decline_buzz_id"
  private static let handledBuzzIdsKey = "handled_incoming_buzz_ids"
  private static let voipTokenKey = "voip_push_token"

  struct LaunchData {
    let invite: [String: Any]
    let action: String
  }

  private static var defaults: UserDefaults? {
    UserDefaults(suiteName: appGroupId)
  }

  static func save(_ payload: [String: Any], action: String = actionOpen) {
    guard let defaults else { return }

    let buzzId = stringValue(payload["buzz_id"])
    if !buzzId.isEmpty, isBuzzIdHandled(buzzId) {
      return
    }

    if let data = try? JSONSerialization.data(withJSONObject: payload),
       let json = String(data: data, encoding: .utf8) {
      defaults.set(json, forKey: payloadKey)
      defaults.set(action, forKey: actionKey)
      defaults.synchronize()
    }
  }

  static func peekRawPayload() -> [String: Any]? {
    guard let defaults,
          let json = defaults.string(forKey: payloadKey),
          let data = json.data(using: .utf8),
          let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      return nil
    }

    return payload
  }

  static func peek() -> LaunchData? {
    guard let payload = peekRawPayload(),
          let defaults else {
      return nil
    }

    let action = defaults.string(forKey: actionKey) ?? actionOpen
    let invite = IncomingCallPayload.toInviteMap(payload)
    return LaunchData(invite: invite, action: action)
  }

  static func clear() {
    guard let defaults else { return }
    defaults.removeObject(forKey: payloadKey)
    defaults.removeObject(forKey: actionKey)
    defaults.synchronize()
  }

  static func updateAction(_ action: String) {
    guard let defaults else { return }
    defaults.set(action, forKey: actionKey)
    defaults.synchronize()
  }

  static func savePendingCancelBuzzId(_ buzzId: String) {
    guard let defaults, !buzzId.isEmpty else { return }
    defaults.set(buzzId, forKey: pendingCancelBuzzIdKey)
    defaults.synchronize()
  }

  static func consumePendingCancelBuzzId() -> String? {
    guard let defaults else { return nil }
    let buzzId = defaults.string(forKey: pendingCancelBuzzIdKey)
    defaults.removeObject(forKey: pendingCancelBuzzIdKey)
    defaults.synchronize()
    return buzzId
  }

  static func savePendingTimeoutBuzzId(_ buzzId: String) {
    guard let defaults, !buzzId.isEmpty else { return }
    defaults.set(buzzId, forKey: pendingTimeoutBuzzIdKey)
    defaults.synchronize()
  }

  static func consumePendingTimeoutBuzzId() -> String? {
    guard let defaults else { return nil }
    let buzzId = defaults.string(forKey: pendingTimeoutBuzzIdKey)
    defaults.removeObject(forKey: pendingTimeoutBuzzIdKey)
    defaults.synchronize()
    return buzzId
  }

  static func savePendingDeclineBuzzId(_ buzzId: String) {
    guard let defaults, !buzzId.isEmpty else { return }
    defaults.set(buzzId, forKey: pendingDeclineBuzzIdKey)
    defaults.synchronize()
  }

  static func consumePendingDeclineBuzzId() -> String? {
    guard let defaults else { return nil }
    let buzzId = defaults.string(forKey: pendingDeclineBuzzIdKey)
    defaults.removeObject(forKey: pendingDeclineBuzzIdKey)
    defaults.synchronize()
    return buzzId
  }

  static func markBuzzIdHandled(_ buzzId: String) {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard let defaults, !normalizedBuzzId.isEmpty else { return }

    var handledBuzzIds = loadHandledBuzzIds()
    handledBuzzIds.insert(normalizedBuzzId)
    defaults.set(Array(handledBuzzIds), forKey: handledBuzzIdsKey)
    defaults.synchronize()
  }

  static func isBuzzIdHandled(_ buzzId: String) -> Bool {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !normalizedBuzzId.isEmpty else { return false }
    return loadHandledBuzzIds().contains(normalizedBuzzId)
  }

  static func clearBuzzIdHandled(_ buzzId: String) {
    let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
    guard let defaults, !normalizedBuzzId.isEmpty else { return }

    var handledBuzzIds = loadHandledBuzzIds()
    handledBuzzIds.remove(normalizedBuzzId)
    defaults.set(Array(handledBuzzIds), forKey: handledBuzzIdsKey)
    defaults.synchronize()
  }

  static func saveVoipPushToken(_ token: String) {
    guard let defaults else { return }
    defaults.set(token, forKey: voipTokenKey)
    defaults.synchronize()
  }

  static func getVoipPushToken() -> String? {
    guard let defaults else { return nil }
    let token = defaults.string(forKey: voipTokenKey)?.trimmingCharacters(in: .whitespacesAndNewlines)
    guard let token, !token.isEmpty else { return nil }
    return token
  }

  private static func loadHandledBuzzIds() -> Set<String> {
    guard let defaults,
          let storedBuzzIds = defaults.array(forKey: handledBuzzIdsKey) as? [String] else {
      return []
    }

    return Set(
      storedBuzzIds
        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        .filter { !$0.isEmpty }
    )
  }

  private static func stringValue(_ value: Any?) -> String {
    if let string = value as? String {
      return string
    }

    if let number = value as? NSNumber {
      return number.stringValue
    }

    return ""
  }
}
