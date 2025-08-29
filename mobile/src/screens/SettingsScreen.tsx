import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import Button from '../components/common/Button';
import LoadingScreen from '../components/common/LoadingScreen';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showArrow?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ 
  title, 
  subtitle, 
  onPress, 
  rightComponent, 
  showArrow = false 
}) => (
  <TouchableOpacity 
    style={styles.settingsRow} 
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.settingsRowContent}>
      <Text style={styles.settingsRowTitle}>{title}</Text>
      {subtitle && (
        <Text style={styles.settingsRowSubtitle}>{subtitle}</Text>
      )}
    </View>
    <View style={styles.settingsRowRight}>
      {rightComponent}
      {showArrow && onPress && (
        <Text style={styles.arrow}>›</Text>
      )}
    </View>
  </TouchableOpacity>
);

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: { username: string; email: string }) => void;
  currentData: { username: string; email: string };
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  visible, 
  onClose, 
  onSave, 
  currentData 
}) => {
  const [username, setUsername] = useState(currentData.username);
  const [email, setEmail] = useState(currentData.email);

  useEffect(() => {
    setUsername(currentData.username);
    setEmail(currentData.email);
  }, [currentData]);

  const handleSave = () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }

    onSave({ username: username.trim(), email: email.trim() });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username..."
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email..."
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              style={styles.modalButton}
            />
            <Button
              title="Save Changes"
              onPress={handleSave}
              style={styles.modalButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const SettingsScreen: React.FC = () => {
  const { state, actions } = useApp();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(state.preferences);

  useEffect(() => {
    setLocalPreferences(state.preferences);
  }, [state.preferences]);

  const handlePreferenceChange = async (key: keyof typeof localPreferences, value: any) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    
    try {
      await actions.updatePreferences(newPreferences);
      actions.showNotification('Settings updated', 'success');
    } catch (error) {
      actions.showNotification('Failed to update settings', 'error');
      // Revert on error
      setLocalPreferences(state.preferences);
    }
  };

  const handleEditProfile = async (data: { username: string; email: string }) => {
    try {
      // In real app, this would update the user profile
      actions.showNotification('Profile updated successfully', 'success');
    } catch (error) {
      actions.showNotification('Failed to update profile', 'error');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await actions.signOut();
              actions.showNotification('Signed out successfully', 'info');
            } catch (error) {
              actions.showNotification('Failed to sign out', 'error');
            }
          }
        }
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data including offline race data and preferences. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await actions.clearCache();
              actions.showNotification('Cache cleared successfully', 'success');
            } catch (error) {
              actions.showNotification('Failed to clear cache', 'error');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data including race history, friends, and vehicles will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Warning',
              'Are you absolutely sure you want to delete your account? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // In real app, this would delete the account
                      actions.showNotification('Account deletion requested', 'info');
                    } catch (error) {
                      actions.showNotification('Failed to delete account', 'error');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export all your DASH RACING data including vehicles, race history, and preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            actions.showNotification('Data export started - you will receive an email when ready', 'info');
          }
        }
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help with DASH RACING? Choose how you\'d like to contact us.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email Support', onPress: () => actions.showNotification('Opening email...', 'info') },
        { text: 'Live Chat', onPress: () => actions.showNotification('Opening chat...', 'info') },
      ]
    );
  };

  if (state.isLoading) {
    return <LoadingScreen message="Loading settings..." />;
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authPrompt}>
          <Text style={styles.promptText}>Sign in to access settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Account Section */}
          <SettingsSection title="Account">
            <SettingsRow
              title="Profile"
              subtitle={`${state.user.username} • ${state.user.email}`}
              onPress={() => setShowEditProfile(true)}
              showArrow
            />
            <SettingsRow
              title="Racing Stats"
              subtitle={`${state.user.stats?.totalRaces || 0} races • ${state.user.stats?.totalDistance || 0} miles`}
              showArrow
            />
            <SettingsRow
              title="Export Data"
              subtitle="Download all your racing data"
              onPress={handleExportData}
              showArrow
            />
          </SettingsSection>

          {/* Preferences Section */}
          <SettingsSection title="Preferences">
            <SettingsRow
              title="Units"
              subtitle={localPreferences.units === 'metric' ? 'Metric (km/h, km)' : 'Imperial (mph, miles)'}
              onPress={() => {
                const newUnits = localPreferences.units === 'metric' ? 'imperial' : 'metric';
                handlePreferenceChange('units', newUnits);
              }}
              rightComponent={
                <Text style={styles.preferenceValue}>
                  {localPreferences.units === 'metric' ? 'Metric' : 'Imperial'}
                </Text>
              }
              showArrow
            />
          </SettingsSection>

          {/* Notifications Section */}
          <SettingsSection title="Notifications">
            <SettingsRow
              title="Push Notifications"
              subtitle="Receive race invites and updates"
              rightComponent={
                <Switch
                  value={localPreferences.notifications}
                  onValueChange={(value) => handlePreferenceChange('notifications', value)}
                  trackColor={{ false: colors.surface, true: colors.primary + '40' }}
                  thumbColor={localPreferences.notifications ? colors.primary : colors.textSecondary}
                />
              }
            />
            <SettingsRow
              title="Sound Effects"
              subtitle="Engine sounds and race notifications"
              rightComponent={
                <Switch
                  value={localPreferences.soundEnabled}
                  onValueChange={(value) => handlePreferenceChange('soundEnabled', value)}
                  trackColor={{ false: colors.surface, true: colors.primary + '40' }}
                  thumbColor={localPreferences.soundEnabled ? colors.primary : colors.textSecondary}
                />
              }
            />
            <SettingsRow
              title="Vibration"
              subtitle="Haptic feedback for interactions"
              rightComponent={
                <Switch
                  value={localPreferences.vibrationEnabled}
                  onValueChange={(value) => handlePreferenceChange('vibrationEnabled', value)}
                  trackColor={{ false: colors.surface, true: colors.primary + '40' }}
                  thumbColor={localPreferences.vibrationEnabled ? colors.primary : colors.textSecondary}
                />
              }
            />
          </SettingsSection>

          {/* Privacy Section */}
          <SettingsSection title="Privacy & Location">
            <SettingsRow
              title="Location Services"
              subtitle="Required for nearby races and map features"
              rightComponent={
                <Switch
                  value={state.hasLocationPermission}
                  onValueChange={(value) => {
                    if (value) {
                      Alert.alert(
                        'Enable Location',
                        'Allow DASH RACING to access your location to find nearby races and racers?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Enable', 
                            onPress: () => {
                              actions.setLocationPermission(true);
                              actions.showNotification('Location access enabled', 'success');
                            }
                          }
                        ]
                      );
                    } else {
                      actions.setLocationPermission(false);
                      actions.showNotification('Location access disabled', 'info');
                    }
                  }}
                  trackColor={{ false: colors.surface, true: colors.primary + '40' }}
                  thumbColor={state.hasLocationPermission ? colors.primary : colors.textSecondary}
                />
              }
            />
            <SettingsRow
              title="Public Profile"
              subtitle="Allow others to find you by username"
              rightComponent={
                <Switch
                  value={localPreferences.location} // Using as public profile toggle
                  onValueChange={(value) => handlePreferenceChange('location', value)}
                  trackColor={{ false: colors.surface, true: colors.primary + '40' }}
                  thumbColor={localPreferences.location ? colors.primary : colors.textSecondary}
                />
              }
            />
          </SettingsSection>

          {/* App Section */}
          <SettingsSection title="App">
            <SettingsRow
              title="Version"
              subtitle="1.0.0 (Latest)"
              rightComponent={
                <Text style={styles.versionText}>✓ Up to date</Text>
              }
            />
            <SettingsRow
              title="Clear Cache"
              subtitle="Free up storage space"
              onPress={handleClearCache}
              showArrow
            />
            <SettingsRow
              title="Rate App"
              subtitle="Help us improve DASH RACING"
              onPress={() => actions.showNotification('Opening app store...', 'info')}
              showArrow
            />
          </SettingsSection>

          {/* Support Section */}
          <SettingsSection title="Support">
            <SettingsRow
              title="Help Center"
              subtitle="FAQs and tutorials"
              onPress={() => actions.showNotification('Opening help center...', 'info')}
              showArrow
            />
            <SettingsRow
              title="Contact Support"
              subtitle="Get help from our team"
              onPress={handleContactSupport}
              showArrow
            />
            <SettingsRow
              title="Report Bug"
              subtitle="Help us fix issues"
              onPress={() => actions.showNotification('Opening bug report form...', 'info')}
              showArrow
            />
          </SettingsSection>

          {/* Legal Section */}
          <SettingsSection title="Legal">
            <SettingsRow
              title="Privacy Policy"
              onPress={() => actions.showNotification('Opening privacy policy...', 'info')}
              showArrow
            />
            <SettingsRow
              title="Terms of Service"
              onPress={() => actions.showNotification('Opening terms of service...', 'info')}
              showArrow
            />
            <SettingsRow
              title="Licenses"
              subtitle="Open source software used in this app"
              onPress={() => actions.showNotification('Opening licenses...', 'info')}
              showArrow
            />
          </SettingsSection>

          {/* Danger Zone */}
          <SettingsSection title="Danger Zone">
            <SettingsRow
              title="Sign Out"
              onPress={handleSignOut}
              rightComponent={
                <Text style={styles.dangerText}>Sign Out</Text>
              }
            />
            <SettingsRow
              title="Delete Account"
              subtitle="Permanently delete your account and all data"
              onPress={handleDeleteAccount}
              rightComponent={
                <Text style={styles.dangerText}>Delete</Text>
              }
            />
          </SettingsSection>
        </View>
      </ScrollView>

      <EditProfileModal
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={handleEditProfile}
        currentData={{
          username: state.user.username,
          email: state.user.email
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  } as ViewStyle,
  
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  } as TextStyle,
  
  scrollView: {
    flex: 1,
  } as ViewStyle,
  
  content: {
    paddingBottom: spacing.xl,
  } as ViewStyle,
  
  section: {
    marginTop: spacing.lg,
  } as ViewStyle,
  
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  } as TextStyle,
  
  sectionContent: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  } as ViewStyle,
  
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  } as ViewStyle,
  
  settingsRowContent: {
    flex: 1,
  } as ViewStyle,
  
  settingsRowTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  } as TextStyle,
  
  settingsRowSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  } as TextStyle,
  
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  } as ViewStyle,
  
  arrow: {
    ...typography.h3,
    color: colors.textSecondary,
    fontWeight: '300',
  } as TextStyle,
  
  preferenceValue: {
    ...typography.body,
    color: colors.textSecondary,
  } as TextStyle,
  
  versionText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
  } as TextStyle,
  
  dangerText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '500',
  } as TextStyle,
  
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  } as ViewStyle,
  
  promptText: {
    ...typography.h4,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSecondary,
  } as ViewStyle,
  
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: '600',
  } as TextStyle,
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  closeButtonText: {
    ...typography.h4,
    color: colors.textSecondary,
  } as TextStyle,
  
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  } as ViewStyle,
  
  inputGroup: {
    marginBottom: spacing.lg,
  } as ViewStyle,
  
  inputLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  } as TextStyle,
  
  textInput: {
    borderWidth: 1,
    borderColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  } as ViewStyle,
  
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as ViewStyle,
  
  modalButton: {
    flex: 1,
  } as ViewStyle,
});

export default SettingsScreen;