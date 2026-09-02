/** GET /exercises/categories row, reused by Spaces for the "Activity Color"
 * picker (backend SpaceActivityCategoryDto). */
export interface SpaceActivityCategoryContract {
  id: number;
  code: string;
  name: string;
}

/** Public shape of a space's owner (backend SpaceOwnerSummaryDto). */
export interface SpaceOwnerContract {
  id: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
}

export type SpaceVisibility = 'public' | 'private';
export type SpaceMemberRole = 'owner' | 'admin' | 'member';

/** GET/POST/PATCH /spaces(/:id) row (backend SpaceResponseDto). */
export interface SpaceContract {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  visibility: SpaceVisibility;
  activityCategory: SpaceActivityCategoryContract | null;
  createdBy: SpaceOwnerContract;
  membersCount: number;
  isMember: boolean;
  role: SpaceMemberRole | null;
  hasPendingRequest: boolean;
  createdAt: string;
}

/** GET /spaces/:id/members row (backend SpaceMemberResponseDto). */
export interface SpaceMemberContract {
  id: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  role: SpaceMemberRole;
  joinedAt: string;
}

export type SpaceJoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/** GET /spaces/:id/join-requests row (backend SpaceJoinRequestResponseDto). */
export interface SpaceJoinRequestContract {
  id: string;
  status: SpaceJoinRequestStatus;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    profileImageUrl: string | null;
  };
  requestedAt: string;
  respondedAt: string | null;
}

/** POST /spaces/:id/join response (backend JoinSpaceResultDto). */
export interface JoinSpaceResultContract {
  status: 'joined' | 'requested';
  space: SpaceContract;
}

/** Public shape of a space message's author (backend SpaceMessageSenderDto) —
 * unlike 1:1 chat's `MessageContract` (a fixed "other participant" resolved
 * from route params), a space is a group thread where every message can come
 * from a different member, so the sender's identity travels on the message
 * itself. */
export interface SpaceMessageSenderContract {
  id: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
}

/** GET/POST /spaces/:id/messages row (backend SpaceMessageDto). */
export interface SpaceMessageContract {
  id: number;
  spaceId: string;
  sender: SpaceMessageSenderContract;
  content: string;
  sentAt: string;
}

/** GET /spaces/:id/messages response shape — same oldest-first + `nextBefore`
 * cursor pagination as `MessagesPageContract` (1:1 chat). */
export interface SpaceMessagesPageContract {
  messages: SpaceMessageContract[];
  nextBefore: number | null;
}

export interface CreateSpacePayload {
  name: string;
  description?: string;
  imageUrl?: string;
  visibility: SpaceVisibility;
  activityCategoryId?: number;
}

export type UpdateSpacePayload = Partial<CreateSpacePayload>;
