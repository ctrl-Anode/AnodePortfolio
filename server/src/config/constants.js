export const PERMISSIONS = [
  { key: 'users:read', description: 'View any user profile' },
  { key: 'users:create', description: 'Create users' },
  { key: 'users:update', description: 'Update any user' },
  { key: 'users:delete', description: 'Soft-delete users' },
  { key: 'roles:read', description: 'View roles and permissions' },
  { key: 'roles:manage', description: 'Create/update roles and their permissions' },
  { key: 'uploads:create', description: 'Upload files' },
  { key: 'uploads:delete', description: 'Delete any uploaded file' },
  { key: 'notifications:read', description: 'Read own notifications' },
  { key: 'notifications:send', description: 'Send push notifications to users' },
  { key: 'stats:read', description: 'View platform statistics' },
  { key: 'portfolio:manage', description: 'Manage portfolio content (CRUD on all portfolio modules)' }
];

export const SUPER_PERMISSION = '*';

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user'
};

export const DEFAULT_ROLE = ROLES.USER;

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED'
};

export const LOGIN_ALLOWED_STATUSES = [USER_STATUS.ACTIVE];

export const PASSWORD_MIN_LENGTH = 10;

export const UPLOADS = {
  MAX_IMAGE_BYTES: 20 * 1024 * 1024,
  MAX_FILE_BYTES: 25 * 1024 * 1024,
  MAX_DOCUMENT_BYTES: 10 * 1024 * 1024,
  MAX_VIDEO_BYTES: 25 * 1024 * 1024,
  MAX_CERTIFICATE_BYTES: 20 * 1024 * 1024,
  IMAGE_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  DOCUMENT_MIMES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  // A certificate credential can be a PDF or a scanned photo, so accept both.
  CERTIFICATE_MIMES: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  VIDEO_MIMES: ['video/mp4', 'video/webm', 'video/quicktime'],
  IMAGE_VARIANTS: [
    { name: 'thumb', width: 160 },
    { name: 'md', width: 480 },
    { name: 'lg', width: 1280 }
  ]
};

export const CACHE_TTL = {
  USER_WITH_PERMISSIONS: 60,
  ROLE_LIST: 30
};
