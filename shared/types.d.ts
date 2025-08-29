export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    location?: {
        lat: number;
        lng: number;
    };
    preferences: UserPreferences;
    stats: UserStats;
    isPro: boolean;
    createdAt: Date;
}
export interface UserPreferences {
    notifications: boolean;
    location: boolean;
    units: 'metric' | 'imperial';
    soundEnabled: boolean;
    vibrationEnabled: boolean;
}
export interface UserStats {
    totalRaces: number;
    wins: number;
    bestTime: number | null;
    totalDistance: number;
    winRate: number;
    racesWon: number;
    bestLapTime: number | null;
    averageSpeed: number;
}
export interface Vehicle {
    id: string;
    userId: string;
    name: string;
    year: number;
    make: string;
    model: string;
    imageUrl?: string;
    color?: string;
    specs: VehicleSpecs;
    performance?: VehiclePerformance;
    isSelected: boolean;
    createdAt: Date;
}
export interface VehiclePerformance {
    topSpeed: number;
    acceleration: number;
    horsePower: number;
    weight: number;
}
export interface VehicleSpecs {
    horsepower: number;
    torque: number;
    acceleration: number;
    topSpeed: number;
    weight: number;
    transmission: string;
    drivetrain: string;
    fuelType?: string;
    displacement?: number;
}
export interface Race {
    id: string;
    creatorId: string;
    type: 'drag' | 'circuit' | 'drift' | 'time-trial';
    distance: number;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    startTime: Date;
    maxParticipants: number;
    entryRequirements: string[];
    participants: RaceParticipant[];
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    results?: RaceResult[];
    createdAt: Date;
}
export interface RaceParticipant {
    userId: string;
    username: string;
    vehicleId: string;
    vehicle: Vehicle;
    position?: number;
    joinedAt: Date;
}
export interface RaceResult {
    userId: string;
    position: number;
    time: number;
    speed: number;
    vehicleId: string;
}
export interface Meetup {
    id: string;
    creatorId: string;
    title: string;
    description: string;
    type: 'car-meet' | 'cruise' | 'photo-session' | 'track-day';
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    startTime: Date;
    endTime?: Date;
    maxParticipants?: number;
    participants: MeetupParticipant[];
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    createdAt: Date;
}
export interface MeetupParticipant {
    userId: string;
    username: string;
    joinedAt: Date;
}
export interface Friendship {
    id: string;
    requesterId: string;
    addresseeId: string;
    status: 'pending' | 'accepted' | 'blocked';
    createdAt: Date;
}
export interface Friend {
    id: string;
    username: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: Date;
    stats: UserStats;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export type RootStackParamList = {
    Main: undefined;
    Profile: {
        userId: string;
    };
    RaceDetails: {
        raceId: string;
    };
    MeetupDetails: {
        meetupId: string;
    };
    VehicleDetails: {
        vehicleId: string;
    };
};
export type MainTabParamList = {
    Home: undefined;
    Garage: undefined;
    Race: undefined;
    Map: undefined;
    Meetup: undefined;
    Friends: undefined;
    Settings: undefined;
};
export interface Location {
    lat: number;
    lng: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
}
export interface AIVehicleEnhancement {
    specs: VehicleSpecs;
    description: string;
    modifications: string[];
    racingTips: string[];
    competitiveAnalysis: string;
}
export interface AIRaceRecommendation {
    raceTypes: string[];
    strategies: string[];
    vehicleSetup: string[];
    trainingTips: string[];
    confidenceScore: number;
}
export interface AIPerformanceAnalysis {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    nextSteps: string[];
}
export interface Notification {
    id: string;
    userId: string;
    type: 'race_invite' | 'friend_request' | 'race_result' | 'meetup_invite';
    title: string;
    message: string;
    data?: any;
    read: boolean;
    createdAt: Date;
}
export interface AppError {
    code: string;
    message: string;
    details?: any;
}
//# sourceMappingURL=types.d.ts.map