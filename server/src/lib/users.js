export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    profile: {
      bio: user.profile?.bio ?? '',
      location: user.profile?.location ?? '',
      interest: user.profile?.interest ?? '',
    },
  };
}
