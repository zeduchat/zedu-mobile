import Foundation
import UIKit

private func incomingCallDarwinCallback(
  _: CFNotificationCenter?,
  _: UnsafeMutableRawPointer?,
  _: CFNotificationName?,
  _: UnsafeRawPointer?,
  _: CFDictionary?
) {
  DispatchQueue.main.async {
    var backgroundTask: UIBackgroundTaskIdentifier = .invalid
    backgroundTask = UIApplication.shared.beginBackgroundTask {
      if backgroundTask != .invalid {
        UIApplication.shared.endBackgroundTask(backgroundTask)
        backgroundTask = .invalid
      }
    }

    IncomingCallCoordinator.shared.presentPendingIncomingCallIfNeeded()

    DispatchQueue.main.asyncAfter(deadline: .now() + 30) {
      if backgroundTask != .invalid {
        UIApplication.shared.endBackgroundTask(backgroundTask)
        backgroundTask = .invalid
      }
    }
  }
}

private func incomingCallCancelDarwinCallback(
  _: CFNotificationCenter?,
  _: UnsafeMutableRawPointer?,
  _: CFNotificationName?,
  _: UnsafeRawPointer?,
  _: CFDictionary?
) {
  DispatchQueue.main.async {
    IncomingCallCoordinator.shared.processPendingEvents()
  }
}

enum IncomingCallDarwinObserver {
  private static let incomingCallName = "net.emerj.zedu.incoming_call" as CFString
  private static let incomingCallCancelName = "net.emerj.zedu.incoming_call_cancel" as CFString

  static func install() {
    let center = CFNotificationCenterGetDarwinNotifyCenter()
    CFNotificationCenterAddObserver(
      center,
      nil,
      incomingCallDarwinCallback,
      incomingCallName,
      nil,
      .deliverImmediately
    )
    CFNotificationCenterAddObserver(
      center,
      nil,
      incomingCallCancelDarwinCallback,
      incomingCallCancelName,
      nil,
      .deliverImmediately
    )
  }

  static func postIncomingCall() {
    CFNotificationCenterPostNotification(
      CFNotificationCenterGetDarwinNotifyCenter(),
      CFNotificationName(incomingCallName),
      nil,
      nil,
      true
    )
  }

  static func postIncomingCallCancel() {
    CFNotificationCenterPostNotification(
      CFNotificationCenterGetDarwinNotifyCenter(),
      CFNotificationName(incomingCallCancelName),
      nil,
      nil,
      true
    )
  }
}
