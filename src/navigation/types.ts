import type { RootStackParamList } from './navigator';

/**
 * Global type declaration for React Navigation.
 * Enables typed useNavigation() and useRoute() without passing generics.
 * @see https://reactnavigation.org/docs/typescript/#specifying-default-types-for-usenavigation-link-ref-etc
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export {};
