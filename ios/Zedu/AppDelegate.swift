import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import RNBootSplash
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    _ = IncomingCallPushKitManager.shared
    IncomingCallCoordinator.shared.configure()
    UNUserNotificationCenter.current().delegate = self

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Zedu",
      in: window,
      launchOptions: launchOptions
    )

    if let remoteNotification = launchOptions?[.remoteNotification] as? [AnyHashable: Any] {
      IncomingCallCoordinator.shared.handleRemoteNotification(
        remoteNotification,
        appState: application.applicationState
      )
    }

    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
      IncomingCallCoordinator.shared.processPendingEvents()
    }

    return true
  }

  func applicationDidBecomeActive(_ application: UIApplication) {
    IncomingCallCoordinator.shared.processPendingEvents()
  }

  func applicationWillEnterForeground(_ application: UIApplication) {
    IncomingCallCoordinator.shared.processPendingEvents()
  }

  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    var backgroundTask: UIBackgroundTaskIdentifier = .invalid
    backgroundTask = application.beginBackgroundTask {
      if backgroundTask != .invalid {
        application.endBackgroundTask(backgroundTask)
        backgroundTask = .invalid
      }
    }

    IncomingCallCoordinator.shared.handleRemoteNotification(
      userInfo,
      appState: application.applicationState
    )
    IncomingCallCoordinator.shared.presentPendingIncomingCallIfNeeded()

    DispatchQueue.main.asyncAfter(deadline: .now() + 30) {
      if backgroundTask != .invalid {
        application.endBackgroundTask(backgroundTask)
        backgroundTask = .invalid
      }
    }

    completionHandler(.newData)
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    let userInfo = notification.request.content.userInfo

    if let additionalData = IncomingCallPayload.extractAdditionalData(from: userInfo),
       IncomingCallPayload.isDirectCallEvent(additionalData)
        || IncomingCallPayload.isDirectCallCancelledEvent(additionalData)
        || IncomingCallPayload.isDirectCallAcceptedElsewhereEvent(additionalData) {
      IncomingCallCoordinator.shared.handleRemoteNotification(
        userInfo,
        appState: UIApplication.shared.applicationState
      )
      completionHandler([])
      return
    }

    completionHandler([.banner, .sound, .badge])
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    IncomingCallCoordinator.shared.handleNotificationResponse(response)
    completionHandler()
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }

   override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView)
  }
}
