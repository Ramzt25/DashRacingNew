import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import LoadingScreen from '../components/common/LoadingScreen';
import Button from '../components/common/Button';

const HomeScreen: React.FC = () => {
  const { state, actions } = useApp();

  useEffect(() => {
    // Load initial data
    if (state.isAuthenticated && state.user) {
      actions.loadRecentRaces();
      
      // Load nearby races if location permission is granted
      if (state.hasLocationPermission) {
        // Mock location for demo - in real app, get from GPS
        actions.loadNearbyRaces(40.7128, -74.0060); // NYC coordinates
      }
    }
  }, [state.isAuthenticated, state.user, state.hasLocationPermission]);

  if (state.isLoading) {
    return <LoadingScreen message="Loading your racing dashboard..." />;
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.welcomeText}>🏎️</Text>
          <Text style={styles.brandName}>DASH RACING</Text>
          <Text style={styles.tagline}>Race Anywhere, Meet Anywhere</Text>
          <Button
            title="Get Started"
            onPress={() => {/* Navigate to auth */}}
            variant="primary"
            size="large"
            fullWidth
            style={styles.authButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>🏎️</Text>
            <View>
              <Text style={styles.welcomeMessage}>Welcome back,</Text>
              <Text style={styles.username}>{state.user.username}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: colors.online }]} />
            <Text style={styles.statusText}>Racing Mode</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{state.vehicles.length}</Text>
              <Text style={styles.statLabel}>Cars Owned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{state.user.stats.totalRaces}</Text>
              <Text style={styles.statLabel}>Total Races</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{state.user.stats.wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {state.user.stats.bestTime ? `${state.user.stats.bestTime.toFixed(2)}s` : '--'}
              </Text>
              <Text style={styles.statLabel}>Best Time</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>🏁</Text>
              <Text style={styles.quickActionTitle}>Find Nearby Races</Text>
              <Text style={styles.quickActionCount}>
                {state.nearbyRaces.length} races nearby
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>⚡</Text>
              <Text style={styles.quickActionTitle}>Create Race</Text>
              <Text style={styles.quickActionSubtitle}>Start racing now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>👥</Text>
              <Text style={styles.quickActionTitle}>Friends Online</Text>
              <Text style={styles.quickActionCount}>
                {state.onlineFriends.length} online
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Indicators */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { 
              backgroundColor: state.hasLocationPermission ? colors.success : colors.warning 
            }]} />
            <Text style={styles.statusLabel}>
              Location {state.hasLocationPermission ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { 
              backgroundColor: state.isConnected ? colors.success : colors.warning 
            }]} />
            <Text style={styles.statusLabel}>
              {state.isConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIndicator, { 
              backgroundColor: state.selectedVehicle ? colors.success : colors.warning 
            }]} />
            <Text style={styles.statusLabel}>
              {state.selectedVehicle ? 'Vehicle Selected' : 'No Vehicle'}
            </Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {state.recentRaces.length > 0 ? (
            state.recentRaces.slice(0, 3).map((race, index) => (
              <View key={race.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>
                    {race.type === 'drag' ? '🏁' : 
                     race.type === 'circuit' ? '🏎️' : 
                     race.type === 'drift' ? '💨' : '⏱️'}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {race.type.charAt(0).toUpperCase() + race.type.slice(1)} Race
                  </Text>
                  <Text style={styles.activitySubtitle}>
                    {race.location.address}
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(race.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No recent races</Text>
              <Text style={styles.emptyStateSubtext}>Join your first race to get started!</Text>
            </View>
          )}
        </View>

        {/* Selected Vehicle Quick Info */}
        {state.selectedVehicle && (
          <View style={styles.vehicleContainer}>
            <Text style={styles.sectionTitle}>Current Vehicle</Text>
            <View style={styles.vehicleCard}>
              <Text style={styles.vehicleName}>
                {state.selectedVehicle.year} {state.selectedVehicle.make} {state.selectedVehicle.model}
              </Text>
              <View style={styles.vehicleSpecs}>
                <Text style={styles.vehicleSpec}>
                  {state.selectedVehicle.specs.horsepower} HP
                </Text>
                <Text style={styles.vehicleSpec}>
                  {state.selectedVehicle.specs.acceleration}s 0-60
                </Text>
                <Text style={styles.vehicleSpec}>
                  {state.selectedVehicle.specs.topSpeed} mph
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  scrollView: {
    flex: 1,
  } as ViewStyle,

  // Auth prompt styles
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,

  welcomeText: {
    fontSize: 64,
    marginBottom: spacing.md,
  } as TextStyle,

  brandName: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: spacing.xs,
  } as TextStyle,

  tagline: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  } as TextStyle,

  authButton: {
    marginTop: spacing.lg,
  } as ViewStyle,

  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.md,
  } as ViewStyle,

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  logo: {
    fontSize: 32,
    marginRight: spacing.md,
  } as TextStyle,

  welcomeMessage: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  } as TextStyle,

  username: {
    ...typography.h3,
    color: colors.textPrimary,
    fontWeight: 'bold',
  } as TextStyle,

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  } as ViewStyle,

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  } as ViewStyle,

  statusText: {
    ...typography.caption,
    color: colors.textSecondary,
  } as TextStyle,

  // Section styles
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  } as TextStyle,

  // Stats styles
  statsContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  } as ViewStyle,

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  } as ViewStyle,

  statCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    width: '48%',
    marginBottom: spacing.sm,
    alignItems: 'center',
    ...shadows.sm,
  } as ViewStyle,

  statValue: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: 'bold',
  } as TextStyle,

  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,

  // Quick actions styles
  quickActionsContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  } as ViewStyle,

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,

  quickActionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    width: '30%',
    alignItems: 'center',
    ...shadows.sm,
  } as ViewStyle,

  quickActionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  } as TextStyle,

  quickActionTitle: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing.xs,
  } as TextStyle,

  quickActionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 10,
  } as TextStyle,

  quickActionCount: {
    ...typography.caption,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 10,
  } as TextStyle,

  // Status indicators
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
    paddingTop: 0,
  } as ViewStyle,

  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  } as ViewStyle,

  statusLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  } as TextStyle,

  // Recent activity styles
  recentActivityContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  } as ViewStyle,

  activityItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    marginBottom: spacing.sm,
    ...shadows.sm,
  } as ViewStyle,

  activityIcon: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  activityEmoji: {
    fontSize: 20,
  } as TextStyle,

  activityContent: {
    flex: 1,
  } as ViewStyle,

  activityTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  } as TextStyle,

  activitySubtitle: {
    ...typography.bodySecondary,
    color: colors.textSecondary,
  } as TextStyle,

  activityTime: {
    ...typography.caption,
    color: colors.textTertiary,
  } as TextStyle,

  // Empty state
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  } as ViewStyle,

  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,

  emptyStateSubtext: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  } as TextStyle,

  // Vehicle card styles
  vehicleContainer: {
    padding: spacing.lg,
    paddingTop: 0,
  } as ViewStyle,

  vehicleCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.card,
    borderColor: colors.primary,
    borderWidth: 1,
    ...shadows.sm,
  } as ViewStyle,

  vehicleName: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  } as TextStyle,

  vehicleSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,

  vehicleSpec: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
});

export default HomeScreen;