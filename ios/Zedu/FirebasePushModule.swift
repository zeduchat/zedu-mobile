import Foundation
import React
import UIKit
import UserNotifications
import FirebaseMessaging

@objc(FirebasePushIOS)
class FirebasePushModule: RCTEventEmitter {
  private static weak var sharedInstance: FirebasePushModule?
  private static var hasListeners = false
  private static var pendingOpened: [String: String]?
  private static var pendingTokenResolvers: [Int: RCTPromiseResolveBlock] = [:]
  private static var tokenWaitId = 0

  override init() {
    super.init()
    FirebasePushModule.sharedInstance = self
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  override func supportedEvents() -> [String]! {
    ["FirebasePushToken", "FirebasePushMessage", "FirebasePushOpened"]
  }

  override func startObserving() {
    Self.hasListeners = true
    if let pending = Self.pendingOpened {
      Self.pendingOpened = nil
      sendEvent(withName: "FirebasePushOpened", body: pending)
    }
  }

  override func stopObserving() {
    Self.hasListeners = false
  }

  @objc
  func requestPermission(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
      DispatchQueue.main.async {
        UIApplication.shared.registerForRemoteNotifications()
        if let error {
          reject("fcm_permission", error.localizedDescription, error)
          return
        }
        resolve(granted)
      }
    }
  }

  @objc
  func getToken(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
      DispatchQueue.main.async {
        if let error {
          reject("fcm_permission", error.localizedDescription, error)
          return
        }
        guard granted else {
          resolve(NSNull())
          return
        }

        UIApplication.shared.registerForRemoteNotifications()
        Messaging.messaging().token { token, tokenError in
          if let token, !token.isEmpty {
            resolve(token)
            return
          }
          if let tokenError {
            NSLog("Firebase token is not ready yet: %@", tokenError.localizedDescription)
          }
          Self.waitForToken(resolve)
        }
      }
    }
  }

  @objc
  func deleteToken(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Messaging.messaging().deleteToken { error in
      if let error {
        reject("fcm_token", error.localizedDescription, error)
        return
      }
      resolve(NSNull())
    }
  }

  @objc
  func getInitialNotification(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    if let pending = Self.pendingOpened {
      Self.pendingOpened = nil
      resolve(pending)
      return
    }
    resolve(NSNull())
  }

  static func emitToken(_ token: String?) {
    guard let token, !token.isEmpty else { return }

    DispatchQueue.main.async {
      let resolvers = pendingTokenResolvers
      pendingTokenResolvers.removeAll()
      resolvers.values.forEach { $0(token) }
      emit(name: "FirebasePushToken", body: ["token": token])
    }
  }

  static func handleForeground(_ userInfo: [AnyHashable: Any]) {
    let data = payload(from: userInfo)
    DispatchQueue.main.async {
      emit(name: "FirebasePushMessage", body: data)
    }
  }

  static func handleOpened(_ userInfo: [AnyHashable: Any]) {
    let data = payload(from: userInfo)
    guard data["notification_type"] != nil || data["event"] != nil || data["channel_id"] != nil else {
      return
    }

    DispatchQueue.main.async {
      if hasListeners, let instance = sharedInstance {
        instance.sendEvent(withName: "FirebasePushOpened", body: data)
        return
      }
      pendingOpened = data
    }
  }

  private static func waitForToken(_ resolve: @escaping RCTPromiseResolveBlock) {
    let schedule = {
      tokenWaitId += 1
      let waitId = tokenWaitId
      pendingTokenResolvers[waitId] = resolve
      DispatchQueue.main.asyncAfter(deadline: .now() + 20) {
        if pendingTokenResolvers.removeValue(forKey: waitId) != nil {
          resolve(NSNull())
        }
      }
    }

    if Thread.isMainThread {
      schedule()
    } else {
      DispatchQueue.main.async(execute: schedule)
    }
  }

  private static func emit(name: String, body: [String: String]) {
    guard Thread.isMainThread else {
      DispatchQueue.main.async {
        emit(name: name, body: body)
      }
      return
    }
    guard hasListeners, let instance = sharedInstance else { return }
    instance.sendEvent(withName: name, body: body)
  }

  private static func payload(from userInfo: [AnyHashable: Any]) -> [String: String] {
    var data: [String: String] = [:]

    for (key, value) in userInfo {
      guard let key = key as? String else { continue }
      if key == "aps" || key.hasPrefix("gcm.") || key.hasPrefix("google.") {
        continue
      }
      if let text = value as? String, !text.isEmpty {
        data[key] = text
      }
    }

    if let aps = userInfo["aps"] as? [String: Any] {
      if let alert = aps["alert"] as? [String: Any] {
        if let title = alert["title"] as? String, !title.isEmpty {
          data["title"] = title
        }
        if let body = alert["body"] as? String, !body.isEmpty {
          data["body"] = body
        }
      } else if let alert = aps["alert"] as? String, !alert.isEmpty {
        data["body"] = alert
      }
    }

    return data
  }
}
