/**
 * SMRITI+ — Role-Based Navigation System
 *
 * Implements Section 4 & 13:
 * - Single entry point with role detection
 * - 3 distinct, tailored navigation shells (Elderly, Caregiver, Health Worker)
 * - Minimum 56dp tap targets on navigation elements
 * - Every icon paired with a visible text label (never icon-only for elderly)
 * - Direct routing to Games, Reminders, Voice Assistant, Family Help, and Settings
 */

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';

import { useAuthStore, UserRole } from '../state/authStore';
import { colors, typography, spacing, fontFamily } from '../theme/tokens';
import { useTranslation, SupportedLanguage } from '../i18n';

import {
  Home,
  Gamepad2,
  Bell,
  Settings,
  LayoutDashboard,
  Image as ImageIcon,
  ClipboardList,
} from 'lucide-react-native';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import ConsentScreen from '../screens/onboarding/ConsentScreen';
import ElderHomeScreen from '../screens/elderly/HomeScreen';
import GamesListScreen from '../screens/elderly/GamesListScreen';
import RemindersScreen from '../screens/elderly/RemindersScreen';
import FamilyCornerScreen from '../screens/elderly/FamilyCornerScreen';
import MemoryBoxScreen from '../screens/elderly/MemoryBoxScreen';
import VoiceAssistantScreen from '../screens/elderly/VoiceAssistantScreen';
import CaregiverDashboardScreen from '../screens/caregiver/DashboardScreen';
import ReminderManagementScreen from '../screens/caregiver/ReminderManagement';
import MemoryManagerScreen from '../screens/caregiver/MemoryManagerScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';
import GroupOverviewScreen from '../screens/healthworker/GroupOverviewScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const commonTabOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.teal,
  tabBarInactiveTintColor: colors.muted,
  tabBarStyle: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : Platform.OS === 'android' ? 76 : 70,
    paddingBottom: Platform.OS === 'ios' ? 28 : Platform.OS === 'android' ? 14 : 10,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabBarLabelStyle: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0,
    marginTop: 2,
  },
  tabBarIconStyle: {
    marginBottom: 0,
  },
  tabBarHideOnKeyboard: true,
};

// ── Elderly Tab Navigator ──
function ElderlyTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={commonTabOptions} backBehavior="history">
      <Tab.Screen
        name="Home"
        component={ElderHomeScreen}
        options={{
          tabBarLabel: t('nav.home') || 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={24} color={color} strokeWidth={focused ? 2.5 : 1.9} />
          ),
        }}
      />
      <Tab.Screen
        name="Games"
        component={GamesListScreen}
        options={{
          tabBarLabel: t('nav.games') || 'Games',
          tabBarIcon: ({ color, focused }) => (
            <Gamepad2 size={24} color={color} strokeWidth={focused ? 2.5 : 1.9} />
          ),
        }}
      />
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          tabBarLabel: t('nav.reminders') || 'Reminders',
          tabBarIcon: ({ color, focused }) => (
            <Bell size={24} color={color} strokeWidth={focused ? 2.5 : 1.9} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('nav.settings') || 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={24} color={color} strokeWidth={focused ? 2.5 : 1.9} />
          ),
        }}
      />
      <Tab.Screen
        name="VoiceAssistant"
        component={VoiceAssistantScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="FamilyCorner"
        component={FamilyCornerScreen}
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}

// ── Caregiver Tab Navigator ──
function CaregiverTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={commonTabOptions} backBehavior="history">
      <Tab.Screen
        name="Dashboard"
        component={CaregiverDashboardScreen}
        options={{
          tabBarLabel: t('nav.dashboard') || 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard size={24} color={color} strokeWidth={focused ? 2.5 : 1.9} />
          ),
        }}
      />
      <Tab.Screen
        name="Reminders"
        component={ReminderManagementScreen}
        options={{
          tabBarLabel: t('nav.reminders') || 'Reminders',
          tabBarIcon: ({ color, focused }) => (
            <Bell size={24} color={color} strokeWidth={focused ? 2.5 : 1.9} />
          ),
        }}
      />
      <Tab.Screen
        name="Memories"
        component={MemoryManagerScreen}
        options={{
          tabBarLabel: t('nav.memories') || 'Memories',
          tabBarIcon: ({ color, focused }) => (
            <ImageIcon size={24} color={color} strokeWidth={focused ? 2.5 : 1.9} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('nav.settings') || 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={24} color={color} strokeWidth={focused ? 2.5 : 1.9} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ── Health Worker Tab Navigator ──
function HealthWorkerTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={commonTabOptions} backBehavior="history">
      <Tab.Screen
        name="GroupOverview"
        component={GroupOverviewScreen}
        options={{
          tabBarLabel: t('nav.group') || 'Group',
          tabBarIcon: ({ color, focused }) => (
            <ClipboardList size={24} color={color} strokeWidth={focused ? 2.5 : 1.9} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('nav.settings') || 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings size={24} color={color} strokeWidth={focused ? 2.5 : 1.9} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

import { useSettingsStore } from '../state/settingsStore';

// ── Root Navigator ──
export default function AppNavigator() {
  const { isAuthenticated, user } = useAuthStore();
  const { setLanguage } = useTranslation();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [showingConsent, setShowingConsent] = useState(false);

  React.useEffect(() => {
    useAuthStore.getState().hydrateAuth();
    useSettingsStore.getState().loadSettings();
  }, []);

  const getRoleNavigator = (role?: UserRole) => {
    switch (role) {
      case 'caregiver':
        return CaregiverTabs;
      case 'health_worker':
        return HealthWorkerTabs;
      case 'elderly':
      default:
        return ElderlyTabs;
    }
  };

  const handleWelcomeProceed = (lang: string, role: string) => {
    setLanguage(lang as SupportedLanguage);
    setShowingConsent(true);
  };

  const handleConsentAgreed = () => {
    setShowingConsent(false);
    setHasCompletedOnboarding(true);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        {!hasCompletedOnboarding ? (
          showingConsent ? (
            <Stack.Screen name="Consent">
              {() => (
                <ConsentScreen
                  onConsentAgreed={handleConsentAgreed}
                  onDecline={() => setShowingConsent(false)}
                />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Welcome">
              {() => <WelcomeScreen onProceed={handleWelcomeProceed} />}
            </Stack.Screen>
          )
        ) : !isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={getRoleNavigator(user?.role)} />
            <Stack.Screen name="VoiceAssistant" component={VoiceAssistantScreen} />
            <Stack.Screen name="FamilyCorner" component={FamilyCornerScreen} />
            <Stack.Screen name="Family" component={FamilyCornerScreen} />
            <Stack.Screen name="MemoryBox" component={MemoryBoxScreen} />
            <Stack.Screen name="MemoryManager" component={MemoryManagerScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({});
