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
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, spacing, typography, borderRadius, shadows } from '../utils/theme';
import Button, { RaceButton } from '../components/common/Button';
import LoadingScreen from '../components/common/LoadingScreen';

interface Meetup {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerName: string;
  dateTime: Date;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  type: 'car-show' | 'group-cruise' | 'racing-event' | 'workshop' | 'social';
  maxParticipants: number;
  participants: string[];
  isPrivate: boolean;
  requiredVehicleTypes?: string[];
  entryFee?: number;
  prizes?: string[];
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

interface CreateMeetupModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateMeetup: (meetupData: any) => void;
}

const CreateMeetupModal: React.FC<CreateMeetupModalProps> = ({ visible, onClose, onCreateMeetup }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<Meetup['type']>('group-cruise');
  const [maxParticipants, setMaxParticipants] = useState<number>(20);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [entryFee, setEntryFee] = useState('');

  const meetupTypes = [
    { id: 'car-show', name: 'Car Show', icon: '🚗', description: 'Display your ride' },
    { id: 'group-cruise', name: 'Group Cruise', icon: '🛣️', description: 'Scenic drive together' },
    { id: 'racing-event', name: 'Racing Event', icon: '🏁', description: 'Competitive racing' },
    { id: 'workshop', name: 'Workshop', icon: '🔧', description: 'Learn and share skills' },
    { id: 'social', name: 'Social Meetup', icon: '🍕', description: 'Hang out and chat' },
  ];

  const participantOptions = [5, 10, 15, 20, 30, 50, 100];

  const handleCreateMeetup = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a meetup title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    const meetupData = {
      title: title.trim(),
      description: description.trim(),
      type: selectedType,
      dateTime: selectedDate,
      maxParticipants,
      isPrivate,
      location: {
        address: 'Current Location',
        lat: 40.7128,
        lng: -74.0060,
      },
      entryFee: entryFee ? parseFloat(entryFee) : undefined,
      status: 'upcoming' as const,
    };

    onCreateMeetup(meetupData);
    
    // Reset form
    setTitle('');
    setDescription('');
    setSelectedType('group-cruise');
    setMaxParticipants(20);
    setIsPrivate(false);
    setEntryFee('');
    
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Create Meetup</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Basic Info */}
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Meetup Title</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter meetup title..."
              placeholderTextColor={colors.textSecondary}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your meetup..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          {/* Meetup Type */}
          <Text style={styles.sectionTitle}>Meetup Type</Text>
          <View style={styles.typeGrid}>
            {meetupTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.selectedType
                ]}
                onPress={() => setSelectedType(type.id as Meetup['type'])}
              >
                <Text style={styles.typeIcon}>{type.icon}</Text>
                <Text style={styles.typeName}>{type.name}</Text>
                <Text style={styles.typeDescription}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Settings */}
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Private Meetup</Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: colors.surface, true: colors.primary + '40' }}
              thumbColor={isPrivate ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Max Participants</Text>
            <View style={styles.participantGrid}>
              {participantOptions.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.participantOption,
                    maxParticipants === count && styles.selectedParticipant
                  ]}
                  onPress={() => setMaxParticipants(count)}
                >
                  <Text style={[
                    styles.participantText,
                    maxParticipants === count && styles.selectedParticipantText
                  ]}>
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Entry Fee (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={entryFee}
              onChangeText={setEntryFee}
              placeholder="$0.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />
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
            title="Create Meetup"
            onPress={handleCreateMeetup}
            raceType="create"
            style={styles.modalButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

interface MeetupCardProps {
  meetup: Meetup;
  onJoinMeetup: (meetup: Meetup) => void;
  onViewDetails: (meetup: Meetup) => void;
  isJoining: boolean;
  currentUserId?: string;
}

const MeetupCard: React.FC<MeetupCardProps> = ({ 
  meetup, 
  onJoinMeetup, 
  onViewDetails, 
  isJoining,
  currentUserId 
}) => {
  const isOrganizer = meetup.organizerId === currentUserId;
  const isJoined = meetup.participants.includes(currentUserId || '');
  const spotsLeft = meetup.maxParticipants - meetup.participants.length;

  const getTypeIcon = (type: Meetup['type']) => {
    switch (type) {
      case 'car-show': return '🚗';
      case 'group-cruise': return '🛣️';
      case 'racing-event': return '🏁';
      case 'workshop': return '🔧';
      case 'social': return '🍕';
      default: return '📅';
    }
  };

  return (
    <View style={styles.meetupCard}>
      <View style={styles.meetupHeader}>
        <View style={styles.meetupInfo}>
          <Text style={styles.meetupIcon}>{getTypeIcon(meetup.type)}</Text>
          <View style={styles.meetupDetails}>
            <Text style={styles.meetupTitle}>{meetup.title}</Text>
            <Text style={styles.meetupOrganizer}>by {meetup.organizerName}</Text>
          </View>
        </View>
        <View style={styles.meetupMeta}>
          {meetup.isPrivate && (
            <Text style={styles.privateBadge}>🔒 Private</Text>
          )}
          <Text style={[styles.statusBadge, { backgroundColor: 
            meetup.status === 'upcoming' ? colors.warning :
            meetup.status === 'active' ? colors.success :
            meetup.status === 'completed' ? colors.textSecondary : colors.warning
          }]}>
            {meetup.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.meetupDescription} numberOfLines={2}>
        {meetup.description}
      </Text>

      <View style={styles.meetupInfoRow}>
        <Text style={styles.meetupDateTime}>
          📅 {meetup.dateTime.toLocaleDateString()} at {meetup.dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <View style={styles.meetupInfoRow}>
        <Text style={styles.meetupLocation}>📍 {meetup.location.address}</Text>
      </View>

      <View style={styles.meetupStats}>
        <Text style={styles.meetupParticipants}>
          👥 {meetup.participants.length}/{meetup.maxParticipants} participants
        </Text>
        {meetup.entryFee && (
          <Text style={styles.meetupFee}>💰 ${meetup.entryFee}</Text>
        )}
      </View>

      <View style={styles.meetupActions}>
        <Button
          title="Details"
          onPress={() => onViewDetails(meetup)}
          variant="ghost"
          size="small"
          style={styles.detailsButton}
        />
        
        {isOrganizer ? (
          <Button
            title="Manage"
            onPress={() => onViewDetails(meetup)}
            variant="secondary"
            size="small"
          />
        ) : isJoined ? (
          <Button
            title="Joined ✓"
            onPress={() => {}}
            variant="success"
            size="small"
            disabled
          />
        ) : meetup.status === 'upcoming' && spotsLeft > 0 ? (
          <RaceButton
            title={isJoining ? "Joining..." : "Join"}
            onPress={() => onJoinMeetup(meetup)}
            raceType="join"
            size="small"
            loading={isJoining}
            disabled={isJoining}
          />
        ) : (
          <Button
            title={spotsLeft === 0 ? "Full" : "Unavailable"}
            onPress={() => {}}
            variant="secondary"
            size="small"
            disabled
          />
        )}
      </View>
    </View>
  );
};

const MeetupScreen: React.FC = () => {
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-meetups' | 'joined'>('browse');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningMeetupId, setJoiningMeetupId] = useState<string | null>(null);
  const [meetups, setMeetups] = useState<Meetup[]>([]);

  useEffect(() => {
    loadMeetups();
  }, []);

  const loadMeetups = () => {
    // Mock meetup data - in real app, this would come from API
    const mockMeetups: Meetup[] = [
      {
        id: '1',
        title: 'Weekend Cars & Coffee',
        description: 'Join us for a relaxed morning meetup with coffee and car talk. All car enthusiasts welcome!',
        organizerId: 'user123',
        organizerName: 'CarEnthusiast92',
        dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        location: {
          address: 'Central Park, NYC',
          lat: 40.7829,
          lng: -73.9654,
        },
        type: 'social',
        maxParticipants: 50,
        participants: ['user1', 'user2', 'user3'],
        isPrivate: false,
        status: 'upcoming',
        createdAt: new Date(),
      },
      {
        id: '2',
        title: 'Sunset Cruise Through the Hills',
        description: 'A scenic group drive through the mountain roads at sunset. Perfect for photography and good vibes.',
        organizerId: 'user456',
        organizerName: 'MountainDriver',
        dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        location: {
          address: 'Blue Ridge Parkway',
          lat: 36.4767,
          lng: -81.8224,
        },
        type: 'group-cruise',
        maxParticipants: 20,
        participants: ['user4', 'user5'],
        isPrivate: false,
        status: 'upcoming',
        createdAt: new Date(),
      },
      {
        id: '3',
        title: 'Track Day at Speedway',
        description: 'Professional track day event. Bring your racing gear and prepare for some serious speed!',
        organizerId: 'user789',
        organizerName: 'SpeedDemon',
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: {
          address: 'Local Speedway',
          lat: 40.7580,
          lng: -73.9855,
        },
        type: 'racing-event',
        maxParticipants: 15,
        participants: ['user6', 'user7', 'user8'],
        isPrivate: false,
        entryFee: 75,
        status: 'upcoming',
        createdAt: new Date(),
      },
    ];

    setMeetups(mockMeetups);
  };

  const handleCreateMeetup = async (meetupData: any) => {
    if (!state.user) return;

    try {
      const newMeetup: Meetup = {
        id: Date.now().toString(),
        ...meetupData,
        organizerId: state.user.id,
        organizerName: state.user.username,
        participants: [],
        createdAt: new Date(),
      };

      setMeetups(prev => [newMeetup, ...prev]);
      actions.showNotification('Meetup created successfully!', 'success');
    } catch (error) {
      actions.showNotification('Failed to create meetup', 'error');
    }
  };

  const handleJoinMeetup = async (meetup: Meetup) => {
    if (!state.user) return;

    setJoiningMeetupId(meetup.id);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMeetups(prev => prev.map(m => 
        m.id === meetup.id 
          ? { ...m, participants: [...m.participants, state.user!.id] }
          : m
      ));
      
      actions.showNotification('Successfully joined meetup!', 'success');
    } catch (error) {
      actions.showNotification('Failed to join meetup', 'error');
    } finally {
      setJoiningMeetupId(null);
    }
  };

  const handleViewMeetupDetails = (meetup: Meetup) => {
    const participantText = meetup.participants.length === 1 ? 'participant' : 'participants';
    const feeText = meetup.entryFee ? `\nEntry Fee: $${meetup.entryFee}` : '';
    const privateText = meetup.isPrivate ? '\n🔒 Private Event' : '';
    
    Alert.alert(
      meetup.title,
      `${meetup.description}\n\nOrganized by: ${meetup.organizerName}\nDate: ${meetup.dateTime.toLocaleDateString()}\nTime: ${meetup.dateTime.toLocaleTimeString()}\nLocation: ${meetup.location.address}\nParticipants: ${meetup.participants.length}/${meetup.maxParticipants} ${participantText}${feeText}${privateText}`,
      [
        { text: 'Close', style: 'cancel' },
        meetup.status === 'upcoming' && 
        meetup.organizerId !== state.user?.id &&
        !meetup.participants.includes(state.user?.id || '') &&
        meetup.participants.length < meetup.maxParticipants
          ? { text: 'Join Meetup', onPress: () => handleJoinMeetup(meetup) }
          : undefined,
      ].filter(Boolean) as any[]
    );
  };

  const getFilteredMeetups = () => {
    switch (activeTab) {
      case 'my-meetups':
        return meetups.filter(m => m.organizerId === state.user?.id);
      case 'joined':
        return meetups.filter(m => m.participants.includes(state.user?.id || ''));
      default:
        return meetups.filter(m => m.status === 'upcoming');
    }
  };

  if (state.isLoading) {
    return <LoadingScreen message="Loading meetups..." />;
  }

  if (!state.isAuthenticated || !state.user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <Text style={styles.promptText}>Sign in to access meetups</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredMeetups = getFilteredMeetups();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Meetups</Text>
        <RaceButton
          title="Create"
          onPress={() => setShowCreateModal(true)}
          raceType="create"
          size="small"
        />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
            Browse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-meetups' && styles.activeTab]}
          onPress={() => setActiveTab('my-meetups')}
        >
          <Text style={[styles.tabText, activeTab === 'my-meetups' && styles.activeTabText]}>
            My Meetups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
          onPress={() => setActiveTab('joined')}
        >
          <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
            Joined
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {filteredMeetups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>
                {activeTab === 'my-meetups' ? '📅' : 
                 activeTab === 'joined' ? '🎫' : '🔍'}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'my-meetups' ? 'No Organized Meetups' :
                 activeTab === 'joined' ? 'No Joined Meetups' : 'No Meetups Found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'my-meetups' ? 'Create your first meetup to get started!' :
                 activeTab === 'joined' ? 'Join some meetups to see them here' : 'Be the first to create a meetup!'}
              </Text>
            </View>
          ) : (
            filteredMeetups.map(meetup => (
              <MeetupCard
                key={meetup.id}
                meetup={meetup}
                onJoinMeetup={handleJoinMeetup}
                onViewDetails={handleViewMeetupDetails}
                isJoining={joiningMeetupId === meetup.id}
                currentUserId={state.user?.id}
              />
            ))
          )}
        </View>
      </ScrollView>

      <CreateMeetupModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateMeetup={handleCreateMeetup}
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
    borderBottomColor: colors.surfaceSecondary,
  } as ViewStyle,
  
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  } as TextStyle,
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
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
  } as ViewStyle,
  
  content: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  } as ViewStyle,
  
  meetupCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  } as ViewStyle,
  
  meetupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  } as ViewStyle,
  
  meetupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  
  meetupIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  } as TextStyle,
  
  meetupDetails: {
    flex: 1,
  } as ViewStyle,
  
  meetupTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
  } as TextStyle,
  
  meetupOrganizer: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  } as TextStyle,
  
  meetupMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  } as ViewStyle,
  
  privateBadge: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '500',
  } as TextStyle,
  
  statusBadge: {
    ...typography.caption,
    color: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    fontWeight: '600',
  } as TextStyle,
  
  meetupDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  } as TextStyle,
  
  meetupInfoRow: {
    marginBottom: spacing.xs,
  } as ViewStyle,
  
  meetupDateTime: {
    ...typography.body,
    color: colors.textSecondary,
  } as TextStyle,
  
  meetupLocation: {
    ...typography.body,
    color: colors.textSecondary,
  } as TextStyle,
  
  meetupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  } as ViewStyle,
  
  meetupParticipants: {
    ...typography.body,
    color: colors.textSecondary,
  } as TextStyle,
  
  meetupFee: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  } as TextStyle,
  
  meetupActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as ViewStyle,
  
  detailsButton: {
    flex: 1,
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
  } as ViewStyle,
  
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  } as TextStyle,
  
  inputGroup: {
    marginBottom: spacing.md,
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
  
  textArea: {
    height: 100,
  } as ViewStyle,
  
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  } as ViewStyle,
  
  typeCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  } as ViewStyle,
  
  selectedType: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  } as ViewStyle,
  
  typeIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  } as TextStyle,
  
  typeName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  } as TextStyle,
  
  typeDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  } as TextStyle,
  
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  } as ViewStyle,
  
  settingLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  } as TextStyle,
  
  participantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  } as ViewStyle,
  
  participantOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceSecondary,
  } as ViewStyle,
  
  selectedParticipant: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  } as ViewStyle,
  
  participantText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  } as TextStyle,
  
  selectedParticipantText: {
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
  
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSecondary,
    gap: spacing.sm,
  } as ViewStyle,
  
  modalButton: {
    flex: 1,
  } as ViewStyle,
});

export default MeetupScreen;