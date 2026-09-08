/**
 * SMRITI+ — Comprehensive Back Navigation & Gesture Handler
 *
 * Provides:
 * 1. Safe goBack logic (falls back to Home tab if canGoBack is false)
 * 2. Android hardware / system navigation bar BackHandler listener
 * 3. Two-finger horizontal swipe gesture detection (swiping with 2 fingers goes back)
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  BackHandler,
  PanResponder,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';

export interface UseBackNavigationOptions {
  onCustomBack?: () => boolean | void;
  fallbackScreen?: string;
  fallbackTab?: string;
  enabled?: boolean;
}

export function useBackNavigation(navigation: any, options?: UseBackNavigationOptions) {
  const { onCustomBack, fallbackScreen = 'Main', fallbackTab = 'Home', enabled = true } = options || {};

  const goBackSafe = useCallback(() => {
    if (onCustomBack) {
      const handled = onCustomBack();
      if (handled !== false) return true;
    }
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }
    try {
      navigation.navigate(fallbackScreen, { screen: fallbackTab });
    } catch {
      try {
        navigation.navigate('Home');
      } catch {}
    }
    return true;
  }, [navigation, onCustomBack, fallbackScreen, fallbackTab]);

  useEffect(() => {
    if (!enabled) return;
    const onHardwareBack = () => {
      goBackSafe();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [goBackSafe, enabled]);

  const isTwoFingerSwipe = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      // Intercept if 2 fingers are touching so child buttons don't swallow the 2-finger gesture
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        const is2 = evt.nativeEvent.touches.length >= 2 || gestureState.numberActiveTouches >= 2;
        if (is2) isTwoFingerSwipe.current = true;
        return is2;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const is2 = evt.nativeEvent.touches.length >= 2 || gestureState.numberActiveTouches >= 2;
        if (is2) isTwoFingerSwipe.current = true;
        return is2 && (Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10);
      },
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const is2 = evt.nativeEvent.touches.length >= 2 || gestureState.numberActiveTouches >= 2;
        if (is2) isTwoFingerSwipe.current = true;
        return is2;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const is2 = evt.nativeEvent.touches.length >= 2 || gestureState.numberActiveTouches >= 2;
        if (is2) isTwoFingerSwipe.current = true;
        return is2 && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length >= 2 || gestureState.numberActiveTouches >= 2) {
          isTwoFingerSwipe.current = true;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length >= 2 || gestureState.numberActiveTouches >= 2) {
          isTwoFingerSwipe.current = true;
        }
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const wasTwoFingers = isTwoFingerSwipe.current;
        isTwoFingerSwipe.current = false;
        // Swiping left or horizontal displacement
        const swipedLeftOrHorizontal =
          gestureState.dx < -20 ||
          Math.abs(gestureState.dx) > 25 ||
          gestureState.vx < -0.2 ||
          Math.abs(gestureState.vx) > 0.3;

        if (wasTwoFingers && swipedLeftOrHorizontal) {
          goBackSafe();
        }
      },
      onPanResponderTerminate: () => {
        isTwoFingerSwipe.current = false;
      },
    })
  ).current;

  return { goBackSafe, panHandlers: panResponder.panHandlers };
}

interface ScreenBackContainerProps {
  navigation: any;
  onCustomBack?: () => boolean | void;
  fallbackScreen?: string;
  fallbackTab?: string;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function ScreenBackContainer({
  navigation,
  onCustomBack,
  fallbackScreen,
  fallbackTab,
  style,
  children,
}: ScreenBackContainerProps) {
  const { panHandlers } = useBackNavigation(navigation, {
    onCustomBack,
    fallbackScreen,
    fallbackTab,
  });

  return (
    <View style={[{ flex: 1 }, style]} {...panHandlers}>
      {children}
    </View>
  );
}
