import Foundation
import UIKit
import React

@objc(CallKeepAwake)
class CallKeepAwake: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc
  func setEnabled(_ enabled: Bool,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      UIApplication.shared.isIdleTimerDisabled = enabled
      resolve(nil)
    }
  }
}
