import { prisma } from "@/lib/db";
import { SPORT_TYPES, type SportType } from "@/lib/sport";
import type { PlanTier, Subscription } from "@prisma/client";

export type PlanCatalogEntry = {
  tier: PlanTier;
  label: string;
  priceMonthlyCents: number;
  /** Only START offers a one-off "avulso" purchase instead of a subscription. */
  priceAvulsoCents?: number;
  /** Time-limited launch promo: `promoPriceMonthlyCents` replaces `priceMonthlyCents` until `promoEndsAt`. */
  promoPriceMonthlyCents?: number;
  promoEndsAt?: Date;
  highlight?: boolean;
  maxTeamsPerTournament: number | null;
  maxActiveTournaments: number | null;
  allowedSports: readonly SportType[];
  canChargeRegistration: boolean;
  canWhiteLabel: boolean;
  /** Cross-tournament athlete registry (by CPF) + team-transfer requests. */
  canManageAthleteRegistry: boolean;
  features: string[];
};

/** Launch promo window: 7 days from the promo's launch (2026-09-10 19:23 UTC). */
export const PRO_PROMO_ENDS_AT = new Date("2026-09-17T19:23:33Z");

export const PLAN_CATALOG: Record<PlanTier, PlanCatalogEntry> = {
  START: {
    tier: "START",
    label: "Start",
    priceMonthlyCents: 2990,
    priceAvulsoCents: 2500,
    maxTeamsPerTournament: 16,
    maxActiveTournaments: 2,
    allowedSports: ["FUTEBOL_CAMPO", "FUTSAL"],
    canChargeRegistration: false,
    canWhiteLabel: false,
    canManageAthleteRegistry: false,
    features: [
      "Até 16 equipes por campeonato",
      "Máximo 2 campeonatos ativos",
      "Futebol de campo e futsal",
      "Tabela, artilharia e cartões",
    ],
  },
  PRO: {
    tier: "PRO",
    label: "Pro",
    priceMonthlyCents: 14700,
    promoPriceMonthlyCents: 8700,
    promoEndsAt: PRO_PROMO_ENDS_AT,
    highlight: true,
    maxTeamsPerTournament: null,
    maxActiveTournaments: null,
    allowedSports: SPORT_TYPES,
    canChargeRegistration: true,
    canWhiteLabel: false,
    canManageAthleteRegistry: false,
    features: [
      "Equipes ilimitadas",
      "Campeonatos ilimitados",
      "Todas as modalidades",
      "Site público personalizado",
      "Ranking geral",
      "Inscrição de equipes com PIX",
    ],
  },
  LIGA: {
    tier: "LIGA",
    label: "Liga",
    priceMonthlyCents: 19700,
    maxTeamsPerTournament: null,
    maxActiveTournaments: null,
    allowedSports: SPORT_TYPES,
    canChargeRegistration: true,
    canWhiteLabel: true,
    canManageAthleteRegistry: true,
    features: [
      "Tudo do Pro",
      "White label: logo própria e domínio personalizado",
      "Financeiro completo",
      "Suporte prioritário",
      "Cadastro de atletas entre campeonatos, com transferência entre equipes",
    ],
  },
};

export const PLAN_ORDER: PlanTier[] = ["START", "PRO", "LIGA"];

/** How a user's tournament count is compared against `maxActiveTournaments`. */
export type TournamentCountMode = "ACTIVE_ONLY" | "LIFETIME";

export type PlanLimits = {
  plan: "TRIAL" | PlanTier;
  maxTeamsPerTournament: number | null;
  maxActiveTournaments: number | null;
  /** ACTIVE_ONLY counts non-FINISHED tournaments (monthly plans, turnover
   *  allowed). LIFETIME counts every tournament ever created since
   *  `tournamentCountSince` (free trial and Start avulso credits — each
   *  credit is consumed once, not renewed by finishing a tournament). */
  tournamentCountMode: TournamentCountMode;
  tournamentCountSince: Date | null;
  allowedSports: readonly SportType[];
  canChargeRegistration: boolean;
  canWhiteLabel: boolean;
  canManageAthleteRegistry: boolean;
};

const TRIAL_LIMITS: Omit<PlanLimits, "tournamentCountSince"> = {
  plan: "TRIAL",
  maxTeamsPerTournament: PLAN_CATALOG.START.maxTeamsPerTournament,
  maxActiveTournaments: 1,
  tournamentCountMode: "LIFETIME",
  allowedSports: PLAN_CATALOG.START.allowedSports,
  canChargeRegistration: false,
  canWhiteLabel: false,
  canManageAthleteRegistry: false,
};

function isSubscriptionCurrentlyActive(sub: Subscription, now: Date): boolean {
  if (sub.status !== "ACTIVE") return false;
  if (sub.paymentType === "PER_TOURNAMENT") return true; // no expiry, consumed by use
  return sub.endDate === null || sub.endDate > now;
}

/**
 * The user's best currently-active subscription, if any (highest plan tier
 * wins when more than one is active — e.g. an unexpired old Start next to a
 * newer Pro). Returns null when the user is on the free trial.
 */
export async function getActiveSubscription(userId: string, now = new Date()): Promise<Subscription | null> {
  const subs = await prisma.subscription.findMany({ where: { userId, status: "ACTIVE" } });
  const active = subs.filter((s) => isSubscriptionCurrentlyActive(s, now));
  if (active.length === 0) return null;

  active.sort((a, b) => PLAN_ORDER.indexOf(b.plan) - PLAN_ORDER.indexOf(a.plan));
  return active[0];
}

export async function getPlanLimits(userId: string, now = new Date()): Promise<PlanLimits> {
  const sub = await getActiveSubscription(userId, now);
  if (!sub) return { ...TRIAL_LIMITS, tournamentCountSince: null };

  const entry = PLAN_CATALOG[sub.plan];
  return {
    plan: entry.tier,
    maxTeamsPerTournament: entry.maxTeamsPerTournament,
    maxActiveTournaments: entry.maxActiveTournaments,
    tournamentCountMode: sub.paymentType === "PER_TOURNAMENT" ? "LIFETIME" : "ACTIVE_ONLY",
    tournamentCountSince: sub.paymentType === "PER_TOURNAMENT" ? sub.startDate : null,
    allowedSports: entry.allowedSports,
    canChargeRegistration: entry.canChargeRegistration,
    canWhiteLabel: entry.canWhiteLabel,
    canManageAthleteRegistry: entry.canManageAthleteRegistry,
  };
}

/** Counts the tournaments that count against `limits.maxActiveTournaments`. */
export async function countTournamentsForLimit(userId: string, limits: PlanLimits): Promise<number> {
  if (limits.tournamentCountMode === "ACTIVE_ONLY") {
    return prisma.tournament.count({ where: { organizerId: userId, status: { not: "FINISHED" } } });
  }
  return prisma.tournament.count({
    where: {
      organizerId: userId,
      ...(limits.tournamentCountSince ? { createdAt: { gte: limits.tournamentCountSince } } : {}),
    },
  });
}

/** Counts the teams that count against `limits.maxTeamsPerTournament` (rejected teams don't). */
export async function countTeamsForLimit(tournamentId: string): Promise<number> {
  return prisma.team.count({ where: { tournamentId, status: { not: "REJECTED" } } });
}

export function isSportAllowed(limits: PlanLimits, sportType: SportType): boolean {
  return limits.allowedSports.includes(sportType);
}

export function isWithinTournamentLimit(limits: PlanLimits, currentCount: number): boolean {
  return limits.maxActiveTournaments === null || currentCount < limits.maxActiveTournaments;
}

export function isWithinTeamLimit(limits: PlanLimits, currentCount: number): boolean {
  return limits.maxTeamsPerTournament === null || currentCount < limits.maxTeamsPerTournament;
}

/**
 * The price actually charged for a monthly subscription right now — the
 * promo price while it's running, the regular price otherwise. Used by both
 * the /planos page display and createSubscriptionCharge, so what's shown
 * always matches what's billed.
 */
export function getEffectiveMonthlyPriceCents(entry: PlanCatalogEntry, now = new Date()): number {
  if (entry.promoPriceMonthlyCents && entry.promoEndsAt && now < entry.promoEndsAt) {
    return entry.promoPriceMonthlyCents;
  }
  return entry.priceMonthlyCents;
}

export function isPromoActive(entry: PlanCatalogEntry, now = new Date()): boolean {
  return Boolean(entry.promoPriceMonthlyCents && entry.promoEndsAt && now < entry.promoEndsAt);
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
