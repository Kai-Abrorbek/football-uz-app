import { MatchEvent } from "../types";

export interface PlayerEvents {
  goals: number;
  assists: number;
  yellowCard: boolean;
  redCard: boolean;
  substitutedOut?: number;
  substitutedIn?: number;
}

export const buildPlayerEventsMap = (
  events: MatchEvent[],
): Record<number, PlayerEvents> => {
  const map: Record<number, PlayerEvents> = {};

  const getOrCreate = (id: number): PlayerEvents => {
    if (!map[id]) {
      map[id] = { goals: 0, assists: 0, yellowCard: false, redCard: false };
    }
    return map[id];
  };

  for (const event of events) {
    if (!event.player?.id) continue;

    const playerId = event.player.id;
    const entry = getOrCreate(playerId);

    if (event.type === "Goal" && event.detail !== "Missed Penalty") {
      entry.goals += 1;
      if (event.assist?.id != null) {
        // ✅
        const assistEntry = getOrCreate(event.assist.id);
        assistEntry.assists += 1;
      }
    }

    if (event.type === "Card") {
      if (event.detail === "Yellow Card") entry.yellowCard = true;
      if (event.detail === "Red Card" || event.detail === "Second Yellow card")
        entry.redCard = true;
    }

    if (event.type === "subst") {
      entry.substitutedOut = event.time?.elapsed;
      if (event.assist?.id != null) {
        // ✅
        const inEntry = getOrCreate(event.assist.id);
        inEntry.substitutedIn = event.time?.elapsed;
      }
    }
  }

  return map;
};
