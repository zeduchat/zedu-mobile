import Foundation

enum IncomingCallPayload {
  static func isDirectCallEvent(_ data: [String: Any]) -> Bool {
    stringValue(data["event"]) == "direct_call_initiated"
  }

  static func isDirectCallCancelledEvent(_ data: [String: Any]) -> Bool {
    let event = stringValue(data["event"])
    let notificationType = stringValue(data["notification_type"])
    let joinStatus = stringValue(data["join_status"]).lowercased()
    let buzzId = stringValue(data["buzz_id"])

    guard !buzzId.isEmpty else {
      return false
    }

    let cancelEvents: Set<String> = [
      "direct_call_canceled",
      "direct_call_cancelled",
      "direct_call_ended",
      "direct_call_cancel",
    ]

    let cancelNotificationTypes: Set<String> = cancelEvents.union(["buzz_ended"])
    let cancelJoinStatuses: Set<String> = ["canceled", "cancelled", "cancel", "ended", "missed"]

    if cancelEvents.contains(event) || cancelNotificationTypes.contains(notificationType) {
      return true
    }

    if cancelJoinStatuses.contains(joinStatus) {
      return true
    }

    if data["user_cancelled"] != nil || data["caller_cancelled"] != nil {
      return true
    }

    return false
  }

  static func isDirectCallAcceptedElsewhereEvent(_ data: [String: Any]) -> Bool {
    let notificationType = stringValue(data["notification_type"]).lowercased()
    let joinStatus = stringValue(data["join_status"]).lowercased()
    let buzzId = stringValue(data["buzz_id"])

    guard !buzzId.isEmpty else {
      return false
    }

    if notificationType == "direct_call_response"
        && (joinStatus == "accept" || joinStatus == "accepted") {
      return true
    }

    return false
  }

  static func toInviteMap(_ data: [String: Any]) -> [String: Any] {
    let hostId = stringValue(data["host_id"], fallback: stringValue(data["caller_id"]))
    let callerId = stringValue(data["caller_id"], fallback: hostId)

    return [
      "buzz_id": stringValue(data["buzz_id"]),
      "host_id": hostId,
      "caller_id": callerId,
      "channel_id": stringValue(data["channel_id"]),
      "buzz_code": stringValue(data["buzz_code"]),
      "caller_name": stringValue(data["caller_name"]),
      "avatar_url": stringValue(data["avatar_url"]),
      "default_avatar_url": stringValue(data["default_avatar_url"]),
      "participants": parseParticipants(data["participants"]),
    ]
  }

  static func extractAdditionalData(from userInfo: [AnyHashable: Any]) -> [String: Any]? {
    if let custom = userInfo["custom"] as? [String: Any],
       let additional = custom["a"] as? [String: Any] {
      return additional
    }

    if let customString = userInfo["custom"] as? String,
       let customData = customString.data(using: .utf8),
       let custom = try? JSONSerialization.jsonObject(with: customData) as? [String: Any],
       let additional = custom["a"] as? [String: Any] {
      return additional
    }

    if let additional = userInfo["additionalData"] as? [String: Any] {
      return additional
    }

    if let data = userInfo["data"] as? [String: Any] {
      return data
    }

    let rootPayload = userInfo.reduce(into: [String: Any]()) { result, entry in
      guard let key = entry.key as? String else { return }
      result[key] = entry.value
    }

    if isDirectCallEvent(rootPayload) || isDirectCallCancelledEvent(rootPayload) {
      return rootPayload
    }

    return nil
  }

  private static func parseParticipants(_ raw: Any?) -> [[String: Any]] {
    if let array = raw as? [[String: Any]] {
      return array
    }

    if let array = raw as? [Any] {
      return array.compactMap { $0 as? [String: Any] }
    }

    if let json = raw as? String,
       let data = json.data(using: .utf8),
       let array = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
      return array
    }

    return []
  }

  private static func stringValue(_ value: Any?, fallback: String = "") -> String {
    if let string = value as? String {
      return string
    }

    if let number = value as? NSNumber {
      return number.stringValue
    }

    return fallback
  }
}
