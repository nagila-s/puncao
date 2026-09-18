import { getLandingUrl } from '@/lib/siteUrl';

export const BackToLanding = () => {
  const href = getLandingUrl();
  if (!href) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-center">
      <a href={href} className="underline underline-offset-4 text-muted-foreground">
        Voltar
      </a>
    </p>
  );
};
