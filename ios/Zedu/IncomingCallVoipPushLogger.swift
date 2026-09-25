import Foundation

enum IncomingCallVoipPushLogger {
  enum Kind: String {
    case directCall = "direct_call"
    case directCallCancel = "direct_call_cancel"
    case unrecognized = "unrecognized"
  }

  private static let maxRecentLogs = 20
  private static var recentLogs: [[String: Any]] = []

  static func logReceived(
    kind: Kind,
    rawPayload: [AnyHashable: Any],
    parsedPayload: [String: Any]? = nil
  ) {
    let sanitizedRaw = sanitize(rawPayload)
    let sanitizedParsed = parsedPayload.map { sanitize($0) }
    let body = buildBody(
      kind: kind.rawValue,
      rawPayload: sanitizedRaw,
      parsedPayload: sanitizedParsed
    )

    appendRecentLog(body)

    if let rawJSON = toJSONString(sanitizedRaw) {
      NSLog("[VoIP Push] kind=%@ raw=%@", kind.rawValue, rawJSON)
    } else {
      NSLog("[VoIP Push] kind=%@ raw=<unserializable>", kind.rawValue)
    }

    if let parsed = sanitizedParsed, let parsedJSON = toJSONString(parsed) {
      NSLog("[VoIP Push] kind=%@ parsed=%@", kind.rawValue, parsedJSON)
    }

    IncomingCallModule.emitVoipPushReceived(body: body)
  }

  static func recentLogsForJS() -> [[String: Any]] {
    recentLogs
  }

  static func clearRecentLogs() {
    recentLogs.removeAll()
  }

  private static func appendRecentLog(_ body: [String: Any]) {
    recentLogs.append(body)
    if recentLogs.count > maxRecentLogs {
      recentLogs.removeFirst(recentLogs.count - maxRecentLogs)
    }
  }

  private static func buildBody(
    kind: String,
    rawPayload: [String: Any],
    parsedPayload: [String: Any]?
  ) -> [String: Any] {
    var body: [String: Any] = [
      "kind": kind,
      "rawPayload": rawPayload,
      "receivedAt": ISO8601DateFormatter().string(from: Date()),
    ]

    if let parsedPayload {
      body["parsedPayload"] = parsedPayload
    }

    return body
  }

  private static func sanitize(_ dictionary: [AnyHashable: Any]) -> [String: Any] {
    var result: [String: Any] = [:]

    dictionary.forEach { key, value in
      guard let key = key as? String else { return }
      result[key] = sanitizeValue(value)
    }

    return result
  }

  private static func sanitizeValue(_ value: Any) -> Any {
    if let dictionary = value as? [AnyHashable: Any] {
      return sanitize(dictionary)
    }

    if let array = value as? [Any] {
      return array.map { sanitizeValue($0) }
    }

    if value is String || value is NSNumber || value is Bool || value is NSNull {
      return value
    }

    return String(describing: value)
  }

  private static func toJSONString(_ object: Any) -> String? {
    guard JSONSerialization.isValidJSONObject(object),
          let data = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys]),
          let json = String(data: data, encoding: .utf8) else {
      return nil
    }

    return json
  }
}
