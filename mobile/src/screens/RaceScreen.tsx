import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { Race, Vehicle } from '../../../shared/types';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import Button, { RaceButton } from '../components/common/Button';
import LoadingScreen, { InlineLoading } from '../components/common/LoadingScreen';

interface CreateRaceModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateRace: (raceData: any) => void;
}

const CreateRaceModal: React.FC<CreateRaceModalProps> = ({ visible, onClose, onCreateRace }) => {
  const [selectedType, setSelectedType] = useState<'drag' | 'circuit' | 'drift' | 'time-trial'>('drag');
  const [selectedDistance, setSelectedDistance] = useState<number>(0.25);
  const [maxParticipants, setMaxParticipants] = useState<number>(8);

  const raceTypes = [
    { id: 'drag', name: 'Drag Race', icon: '🏁', description: 'Straight line speed' },
    { id: 'circuit', name: 'Circuit', icon: '🏎️', description: 'Track racing' },
    { id: 'drift', name: 'Drift', icon: '💨', description: 'Style points' },
    { id: 'time-trial', name: 'Time Trial', icon: '⏱️', description: 'Beat the clock' },
  ];

  const distances = [0.25, 0.5, 1.0, 2.0, 5.0];
  const participantOptions = [2, 4, 6, 8, 12, 16];

  const handleCreateRace = () => {
    const raceData = {
      type: selectedType,
      distance: selectedDistance,
      maxParticipants,
      startTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      location: {
        lat: 40.7128,
        lng: -74.0060,
        address: 'Current Location'
      },
      entryRequirements: [],
      status: 'scheduled' as const,
    };
    
    onCreateRace(raceData);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create New Race</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Race Type Selection */}
          <Text style={styles.sectionTitle}>Race Type</Text>
          <View style={styles.raceTypeGrid}>
            {raceTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.raceTypeCard,
                  selectedType === type.id && styles.selectedRaceType
                ]}
                onPress={() => setSelectedType(type.id as any)}
              >
                <Text style={styles.raceTypeIcon}>{type.icon}</Text>
                <Text style={styles.raceTypeName}>{type.name}</Text>
                <Text style={styles.raceTypeDescription}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Distance Selection */}
          <Text style={styles.sectionTitle}>Distance</Text>
          <View style={styles.distanceGrid}>
            {distances.map((distance) => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.distanceCard,
                  selectedDistance === distance && styles.selectedDistance
                ]}
                onPress={() => setSelectedDistance(distance)}
              >
                <Text style={styles.distanceValue}>{distance}</Text>
                <Text style={styles.distanceUnit}>miles</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Max Participants */}
          <Text style={styles.sectionTitle}>Max Participants</Text>
          <View style={styles.participantGrid}>
            {participantOptions.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.participantCard,
                  maxParticipants === count && styles.selectedParticipant
                ]}
                onPress={() => setMaxParticipants(count)}
              >
                <Text style={styles.participantCount}>{count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            style={styles.modalButton}
          />
          <RaceButton
            title="Create Race"
            onPress={handleCreateRace}
            raceType="create"
            style={styles.modalButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const RaceScreen: React.FC = () => {
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState<'nearby' | 'my-races' | 'history'>('nearby');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningRaceId, setJoiningRaceId] = useState<string | null>(null);

  useEffect(() => {
    // Load nearby races if location is enabled
    if (state.hasLocationPermission) {
      actions.loadNearbyRaces(40.7128, -74.0060); // Mock location
    }
    actions.loadRecentRaces();
  }, [state.hasLocationPermission]);

  const handleJoinRace = async (race: Race) => {
    if (!state.selectedVehicle) {
      Alert.alert('No Vehicle Selected', 'Please select a vehicle in your garage first.');
      return;
    }

    setJoiningRaceId(race.id);
    const success = await actions.joinRace(race.id);
    
    if (success) {
      actions.showNotification('Successfully joined race!', 'success');
    } else {
      actions.showNotification('Failed to join race', 'error');
    }
    
    setJoiningRaceId(null);
  };

  const handleCreateRace = async (raceData: any) => {
    if (!state.user) return;

    try {
      // In real implementation, this would call the API
      const newRace: Race = {
        id: Date.now().toString(),
        creatorId: state.user.id,
        participants: [],
        results: [],
        createdAt: new Date(),
        ...raceData,
      };

      actions.showNotification('Race created successfully!', 'success');
      // Refresh nearby races
      if (state.hasLocationPermission) {
        actions.loadNearbyRaces(40.7128, -74.0060);
      }
    } catch (error) {
      actions.showNotification('Failed to create race', 'error');
    }
  };

  const renderRaceCard = (race: Race) => {
    const isJoining = joiningRaceId === race.id;
    const isMyRace = race.creatorId === state.user?.id;
    const isJoined = race.participants.some(p => p.userId === state.user?.id);

    return (
      <View key={race.id} style={styles.raceCard}>
        <View style={styles.raceHeader}>
          <View style={styles.raceTypeInfo}>
            <Text style={styles.raceTypeEmoji}>
              {race.type === 'drag' ? '🏁' : 
               race.type === 'circuit' ? '🏎️' : 
               race.type === 'drift' ? '💨' : '⏱️'}
            </Text>
            <View>
              <Text style={styles.raceTitle}>
                {race.type.charAt(0).toUpperCase() + race.type.slice(1)} Race
              </Text>
              <Text style={styles.raceDistance}>{race.distance} miles</Text>
            </View>
          </View>
          <View style={styles.raceStatus}>
            <Text style={[styles.statusBadge, { backgroundColor: 
              race.status === 'scheduled' ? colors.warning :
              race.status === 'active' ? colors.success :
              race.status === 'completed' ? colors.textSecondary : colors.warning
            }]}>
              {race.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.raceDetails}>
          <Text style={styles.raceLocation}>📍 {race.location.address}</Text>
          <Text style={styles.raceTime}>
            🕐 {new Date(race.startTime).toLocaleString()}
          </Text>
          <Text style={styles.raceParticipants}>
            👥 {race.participants.length}/{race.maxParticipants} participants
          </Text>
        </View>

        <View style={styles.raceActions}>
          {isMyRace ? (
            <Button
              title="Manage Race"
              onPress={() => actions.showNotification('Race management coming soon!', 'info')}
              variant="secondary"
              size="small"
            />
          ) : isJoined ? (
            <RaceButton
              title="Leave Race"
              onPress={() => actions.leaveRace(race.id)}
              raceType="leave"
              size="small"
            />
          ) : race.status === 'scheduled' ? (
            <RaceButton
              title={isJoining ? "Joining..." : "Join Race"}
              onPress={() => handleJoinRace(race)}
              raceType="join"
              size="small"
              loading={isJoining}
              disabled={isJoining || race.participants.length >= race.maxParticipants}
            />
          ) : (
            <Button
              title="View Results"
              onPress={() => actions.showNotification('Race results coming soon!', 'info')}
              variant="ghost"
              size="small"
            />
          )}
        </View>
      </View>
    );
  };

  if (state.isLoading) {
    return <LoadingScreen message="Loading racing data..." />;
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.authPrompt}>
          <Text style={styles.promptText}>Sign in to access racing features</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>🏁 Racing Hub</Text>
        <RaceButton
          title="Create Race"
          onPress={() => setShowCreateModal(true)}
          raceType="create"
          size="small"
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
          onPress={() => setActiveTab('nearby')}
        >
          <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
            Nearby Races
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-races' && styles.activeTab]}
          onPress={() => setActiveTab('my-races')}
        >
          <Text style={[styles.tabText, activeTab === 'my-races' && styles.activeTabText]}>
            My Races
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Selected Vehicle Warning */}
        {!state.selectedVehicle && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>⚠️ No vehicle selected</Text>
            <Text style={styles.warningSubtext}>
              Select a vehicle in your garage to join races
            </Text>
          </View>
        )}

        {/* Location Permission Warning */}
        {!state.hasLocationPermission && activeTab === 'nearby' && (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>📍 Location access disabled</Text>
            <Text style={styles.warningSubtext}>
              Enable location services to find nearby races
            </Text>
          </View>
        )}

        {/* Race Content */}
        <View style={styles.content}>
          {activeTab === 'nearby' && (
            <>
              {state.nearbyRaces.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🏁</Text>
                  <Text style={styles.emptyTitle}>No Nearby Races</Text>
                  <Text style={styles.emptySubtext}>
                    Be the first to create a race in your area!
                  </Text>
                </View>
              ) : (
                state.nearbyRaces.map(renderRaceCard)
              )}
            </>
          )}

          {activeTab === 'my-races' && (
            <>
              {state.nearbyRaces.filter(r => r.creatorId === state.user?.id).length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>⚡</Text>
                  <Text style={styles.emptyTitle}>No Active Races</Text>
                  <Text style={styles.emptySubtext}>
                    Create your first race to get started!
                  </Text>
                </View>
              ) : (
                state.nearbyRaces
                  .filter(r => r.creatorId === state.user?.id)
                  .map(renderRaceCard)
              )}
            </>
          )}

          {activeTab === 'history' && (
            <>
              {state.recentRaces.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📚</Text>
                  <Text style={styles.emptyTitle}>No Race History</Text>
                  <Text style={styles.emptySubtext}>
                    Your completed races will appear here
                  </Text>
                </View>
              ) : (
                state.recentRaces.map(renderRaceCard)
              )}
            </>
          )}
        </View>
      </ScrollView>

      <CreateRaceModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRace={handleCreateRace}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as ViewStyle,
  
  title: {
    ...typography.h2,
    color: colors.text,
  } as TextStyle,
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  } as ViewStyle,
  
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: 'transparent',
  } as ViewStyle,
  
  activeTab: {
    backgroundColor: colors.primary,
  } as ViewStyle,
  
  tabText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  } as TextStyle,
  
  activeTabText: {
    color: colors.background,
    fontWeight: '600',
  } as TextStyle,
  
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl, // Extra bottom padding for tab bar
  } as ViewStyle,
  
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl, // Extra bottom padding for tab bar
  } as ViewStyle,
  
  warningCard: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  } as ViewStyle,
  
  warningText: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '600',
  } as TextStyle,
  
  warningSubtext: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.xs,
  } as TextStyle,
  
  raceCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  } as ViewStyle,
  
  raceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  } as ViewStyle,
  
  raceTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  
  raceTypeEmoji: {
    fontSize: 32,
    marginRight: spacing.sm,
  } as TextStyle,
  
  raceTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
  } as TextStyle,
  
  raceDistance: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  } as TextStyle,
  
  raceStatus: {
    alignItems: 'flex-end',
  } as ViewStyle,
  
  statusBadge: {
    ...typography.caption,
    color: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    fontWeight: '600',
    overflow: 'hidden',
  } as TextStyle,
  
  raceDetails: {
    marginBottom: spacing.md,
  } as ViewStyle,
  
  raceLocation: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  } as TextStyle,
  
  raceTime: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  } as TextStyle,
  
  raceParticipants: {
    ...typography.body,
    color: colors.textSecondary,
  } as TextStyle,
  
  raceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  } as ViewStyle,
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  } as ViewStyle,
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  } as TextStyle,
  
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  } as TextStyle,
  
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
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
    borderBottomColor: colors.border,
  } as ViewStyle,
  
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  } as TextStyle,
  
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
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
  } as ViewStyle,
  
  sectionTitle: {
    ...typography.h4,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  } as TextStyle,
  
  raceTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  } as ViewStyle,
  
  raceTypeCard: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  } as ViewStyle,
  
  selectedRaceType: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  } as ViewStyle,
  
  raceTypeIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  } as TextStyle,
  
  raceTypeName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  } as TextStyle,
  
  raceTypeDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,
  
  distanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  } as ViewStyle,
  
  distanceCard: {
    width: '18%',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  } as ViewStyle,
  
  selectedDistance: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  } as ViewStyle,
  
  distanceValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  } as TextStyle,
  
  distanceUnit: {
    ...typography.caption,
    color: colors.textSecondary,
  } as TextStyle,
  
  participantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  } as ViewStyle,
  
  participantCard: {
    width: '15%',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  } as ViewStyle,
  
  selectedParticipant: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  } as ViewStyle,
  
  participantCount: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  } as TextStyle,
  
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  } as ViewStyle,
  
  modalButton: {
    flex: 1,
  } as ViewStyle,
});

export default RaceScreen;