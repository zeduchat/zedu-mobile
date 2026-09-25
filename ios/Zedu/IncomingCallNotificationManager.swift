import Foundation
import UserNotifications

enum IncomingCallNotificationManager {
  static let categoryId = "INCOMING_DIRECT_CALL"
  static let acceptActionId = "ACCEPT_INCOMING_CALL"
  static let declineActionId = "DECLINE_INCOMING_CALL"

  static func registerCategories() {
    let accept = UNNotificationAction(
      identifier: acceptActionId,
      title: "Accept",
      options: [.foreground]
    )
    let decline = UNNotificationAction(
      identifier: declineActionId,
      title: "Decline",
      options: [.destructive, .foreground]
    )
    let category = UNNotificationCategory(
      identifier: categoryId,
      actions: [accept, decline],
      intentIdentifiers: [],
      options: [.customDismissAction]
    )

    UNUserNotificationCenter.current().setNotificationCategories([category])
  }

  static func dismiss() {
    UNUserNotificationCenter.current().getDeliveredNotifications { notifications in
      let ids = notifications
        .filter { $0.request.content.categoryIdentifier == categoryId }
        .map(\.request.identifier)

      guard !ids.isEmpty else { return }
      UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ids)
    }
  }
}
