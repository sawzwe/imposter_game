"use client";

import type { ImgHTMLAttributes } from "react";
import { useTheme } from "../ThemeContext";

const BASE = "/assets";

type AssetProps = ImgHTMLAttributes<HTMLImageElement>;

/** Theme-aware Dota logo: red (default), white (cyberpunk), green (solarpunk) */
function DotaLogo(props: AssetProps) {
  const { theme } = useTheme();
  const src =
    theme === "cyberpunk"
      ? `${BASE}/dota/logo_dota_white.png`
      : theme === "solarpunk"
        ? `${BASE}/dota/logo_dota_green.png`
        : `${BASE}/dota/logo_dota_red.svg`;
  return <img src={src} alt="Dota 2" {...props} />;
}

function DotaGreen(props: AssetProps) {
  return (
    <img src={`${BASE}/dota/logo_dota_green.png`} alt="Dota 2" {...props} />
  );
}

function DotaRed(props: AssetProps) {
  return <img src={`${BASE}/dota/logo_dota_red.svg`} alt="Dota 2" {...props} />;
}

function DotaWhite(props: AssetProps) {
  return (
    <img src={`${BASE}/dota/logo_dota_white.png`} alt="Dota 2" {...props} />
  );
}

function DotaSven(props: AssetProps) {
  return <img src={`${BASE}/dota/sven.gif`} alt="Sven" {...props} />;
}

function DotaJuggernut(props: AssetProps) {
  return <img src={`${BASE}/dota/juggernut.png`} alt="Juggernaut" {...props} />;
}

function ClashRoyale(props: AssetProps) {
  return (
    <img
      src={`${BASE}/clash_royale/clash_royale.png`}
      alt="Clash Royale"
      {...props}
    />
  );
}

function ClashRoyaleCrown(props: AssetProps) {
  return (
    <img
      src={`${BASE}/clash_royale/Blue%20Crown%20Animated%202.gif`}
      alt="Clash Royale Crown"
      {...props}
    />
  );
}

function ClashRoyaleEmote(props: AssetProps) {
  return (
    <img
      src={`${BASE}/clash_royale/emotes_golem_sneaky_dl.png`}
      alt="Clash Royale"
      {...props}
    />
  );
}

export {
  DotaLogo,
  DotaGreen,
  DotaRed,
  DotaWhite,
  DotaSven,
  DotaJuggernut,
  ClashRoyale,
  ClashRoyaleCrown,
  ClashRoyaleEmote,
};
