import UserNotifications
import OneSignalExtension

class NotificationService: UNNotificationServiceExtension {
    var contentHandler: ((UNNotificationContent) -> Void)?
    var receivedRequest: UNNotificationRequest!
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.receivedRequest = request
        self.contentHandler = contentHandler
        self.bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        guard let bestAttemptContent = bestAttemptContent else {
            return
        }

        let userInfo = request.content.userInfo
  if let additionalData = IncomingCallNSEHelper.extractAdditionalData(from: userInfo) {
            if IncomingCallNSEHelper.isDirectCallCancelledEvent(additionalData) {
                let buzzId = IncomingCallNSEHelper.stringValue(additionalData["buzz_id"])
                IncomingCallNSEHelper.clearLaunchStore()
                if !buzzId.isEmpty {
                    IncomingCallNSEHelper.savePendingCancelBuzzId(buzzId)
                    IncomingCallNSEHelper.markBuzzIdHandled(buzzId)
                }
                IncomingCallNSEHelper.postIncomingCallCancel()
                bestAttemptContent.sound = nil
                bestAttemptContent.body = ""
                contentHandler(bestAttemptContent)
                return
            }

            if IncomingCallNSEHelper.isDirectCallAcceptedElsewhereEvent(additionalData) {
                let buzzId = IncomingCallNSEHelper.stringValue(additionalData["buzz_id"])
                if !buzzId.isEmpty {
                    IncomingCallNSEHelper.clearLaunchStore()
                    IncomingCallNSEHelper.markBuzzIdHandled(buzzId)
                    IncomingCallNSEHelper.savePendingCancelBuzzId(buzzId)
                    IncomingCallNSEHelper.postIncomingCallCancel()
                }
                bestAttemptContent.sound = nil
                bestAttemptContent.body = ""
                contentHandler(bestAttemptContent)
                return
            }

            if IncomingCallNSEHelper.isDirectCallEvent(additionalData) {
                let buzzId = IncomingCallNSEHelper.stringValue(additionalData["buzz_id"])
                if !buzzId.isEmpty, IncomingCallNSEHelper.isBuzzIdHandled(buzzId) {
                    bestAttemptContent.sound = nil
                    bestAttemptContent.body = ""
                    contentHandler(bestAttemptContent)
                    return
                }

                IncomingCallNSEHelper.saveLaunchPayload(additionalData, action: "open")
                IncomingCallNSEHelper.postIncomingCall()

                let callerName = IncomingCallNSEHelper.stringValue(additionalData["caller_name"])
                bestAttemptContent.title = callerName.isEmpty ? "Incoming call" : callerName
                bestAttemptContent.subtitle = ""
                bestAttemptContent.body = "Incoming video call"
                bestAttemptContent.sound = nil
                bestAttemptContent.categoryIdentifier = "INCOMING_DIRECT_CALL"
                if #available(iOS 15.0, *) {
                    bestAttemptContent.interruptionLevel = .timeSensitive
                }

                contentHandler(bestAttemptContent)
                return
            }
        }

        OneSignalExtension.didReceiveNotificationExtensionRequest(
            self.receivedRequest,
            with: bestAttemptContent,
            withContentHandler: self.contentHandler
        )
    }

    override func serviceExtensionTimeWillExpire() {
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            OneSignalExtension.serviceExtensionTimeWillExpireRequest(self.receivedRequest, with: self.bestAttemptContent)
            contentHandler(bestAttemptContent)
        }
    }
}

private enum IncomingCallNSEHelper {
    private static let appGroupId = "group.net.emerj.zedu.onesignal"
    private static let payloadKey = "payload_json"
    private static let actionKey = "action"
    private static let pendingCancelBuzzIdKey = "pending_cancel_buzz_id"
    private static let handledBuzzIdsKey = "handled_incoming_buzz_ids"

    static func extractAdditionalData(from userInfo: [AnyHashable: Any]) -> [String: Any]? {
        if let custom = userInfo["custom"] as? [String: Any],
           let additional = custom["a"] as? [String: Any] {
            return additional
        }

        if let additional = userInfo["additionalData"] as? [String: Any] {
            return additional
        }

        return nil
    }

    static func isDirectCallEvent(_ data: [String: Any]) -> Bool {
        stringValue(data["event"]) == "direct_call_initiated"
    }

    static func isDirectCallCancelledEvent(_ data: [String: Any]) -> Bool {
        let event = stringValue(data["event"])
        let notificationType = stringValue(data["notification_type"])
        let joinStatus = stringValue(data["join_status"]).lowercased()
        let buzzId = stringValue(data["buzz_id"])

        guard !buzzId.isEmpty else { return false }

        let cancelEvents: Set<String> = [
            "direct_call_canceled",
            "direct_call_cancelled",
            "direct_call_ended",
            "direct_call_cancel",
            "buzz_ended",
        ]

        if cancelEvents.contains(event) || cancelEvents.contains(notificationType) {
            return true
        }

        return ["canceled", "cancelled", "cancel", "ended", "missed"].contains(joinStatus)
    }

    static func isDirectCallAcceptedElsewhereEvent(_ data: [String: Any]) -> Bool {
        let notificationType = stringValue(data["notification_type"]).lowercased()
        let joinStatus = stringValue(data["join_status"]).lowercased()
        let buzzId = stringValue(data["buzz_id"])

        guard !buzzId.isEmpty else { return false }

        return notificationType == "direct_call_response"
            && (joinStatus == "accept" || joinStatus == "accepted")
    }

    static func shouldDismissIncomingCall(forBuzzId buzzId: String) -> Bool {
        let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedBuzzId.isEmpty,
              let defaults = UserDefaults(suiteName: appGroupId),
              let json = defaults.string(forKey: payloadKey),
              let data = json.data(using: .utf8),
              let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return false
        }

        return stringValue(payload["buzz_id"]) == normalizedBuzzId
    }

    static func markBuzzIdHandled(_ buzzId: String) {
        let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedBuzzId.isEmpty,
              let defaults = UserDefaults(suiteName: appGroupId) else {
            return
        }

        var handledBuzzIds = Set(
            (defaults.array(forKey: handledBuzzIdsKey) as? [String] ?? [])
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
        )
        handledBuzzIds.insert(normalizedBuzzId)
        defaults.set(Array(handledBuzzIds), forKey: handledBuzzIdsKey)
        defaults.synchronize()
    }

    static func saveLaunchPayload(_ payload: [String: Any], action: String) {
        let buzzId = stringValue(payload["buzz_id"])
        if !buzzId.isEmpty, isBuzzIdHandled(buzzId) {
            return
        }

        guard let defaults = UserDefaults(suiteName: appGroupId),
              let data = try? JSONSerialization.data(withJSONObject: payload),
              let json = String(data: data, encoding: .utf8) else {
            return
        }

        defaults.set(json, forKey: payloadKey)
        defaults.set(action, forKey: actionKey)
        defaults.synchronize()
    }

    static func isBuzzIdHandled(_ buzzId: String) -> Bool {
        let normalizedBuzzId = buzzId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedBuzzId.isEmpty,
              let defaults = UserDefaults(suiteName: appGroupId),
              let storedBuzzIds = defaults.array(forKey: handledBuzzIdsKey) as? [String] else {
            return false
        }

        return storedBuzzIds.contains(normalizedBuzzId)
    }

    static func clearLaunchStore() {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        defaults.removeObject(forKey: payloadKey)
        defaults.removeObject(forKey: actionKey)
        defaults.synchronize()
    }

    static func savePendingCancelBuzzId(_ buzzId: String) {
        guard let defaults = UserDefaults(suiteName: appGroupId) else { return }
        defaults.set(buzzId, forKey: pendingCancelBuzzIdKey)
        defaults.synchronize()
    }

    static func stringValue(_ value: Any?) -> String {
        if let string = value as? String {
            return string
        }

        if let number = value as? NSNumber {
            return number.stringValue
        }

        return ""
    }

    static func postIncomingCall() {
        let name = "net.emerj.zedu.incoming_call" as CFString
        CFNotificationCenterPostNotification(
            CFNotificationCenterGetDarwinNotifyCenter(),
            CFNotificationName(name),
            nil,
            nil,
            true
        )
    }

    static func postIncomingCallCancel() {
        let name = "net.emerj.zedu.incoming_call_cancel" as CFString
        CFNotificationCenterPostNotification(
            CFNotificationCenterGetDarwinNotifyCenter(),
            CFNotificationName(name),
            nil,
            nil,
            true
        )
    }
}
