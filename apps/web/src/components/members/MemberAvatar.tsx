import { UserRound } from 'lucide-react';
import { resolveApiUrl } from '../../api/client';

export function MemberAvatar({
  name,
  photoUrl,
  large = false,
}: {
  name: string;
  photoUrl: string | null;
  large?: boolean;
}) {
  const size = large ? 'size-24' : 'size-11';
  if (photoUrl)
    return (
      <img
        alt={`صورة ${name}`}
        className={`${size} shrink-0 rounded-xl object-cover`}
        src={resolveApiUrl(photoUrl)}
      />
    );
  return (
    <span
      aria-hidden="true"
      className={`${size} grid shrink-0 place-items-center rounded-xl bg-[#e2ebe3] text-[#315c45]`}
    >
      <UserRound size={large ? 38 : 20} />
    </span>
  );
}
