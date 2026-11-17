import { create } from 'zustand';
import { getDb } from '../storage/db';
import { getSetting, setSetting } from '../storage/settingsRepo';
import { resetUserState, writeScenario } from '../storage/userStateRepo';
import { fixtureContent } from '../testing/fixtures';
import { scenarios } from '../testing/scenarios';
import { appClock, getClockOffsetMs, setClockOffsetMs } from '../time/appClock';
import { systemClock } from '../time/clock';
import { offsetForLocalTime } from '../time/timeTravel.logic';

const OFFSET_KEY = 'dev.clockOffsetMs';

interface DevState {
  /** What the last dev action did, shown at the top of the menu. */
  status: string;
  hydrate: () => Promise<void>;
  shiftTime: (ms: number) => Promise<void>;
  jumpToLocalTime: (hour: number, minute: number) => Promise<void>;
  resetTime: () => Promise<void>;
  loadScenario: (name: string) => Promise<void>;
  resetUserState: () => Promise<void>;
}

async function saveOffset(offsetMs: number): Promise<void> {
  setClockOffsetMs(offsetMs);
  await setSetting(await getDb(), OFFSET_KEY, offsetMs);
}

export const useDevStore = create<DevState>((set) => ({
  status: '',

  hydrate: async () => {
    const saved = await getSetting<number>(await getDb(), OFFSET_KEY);
    setClockOffsetMs(saved ?? 0);
  },

  shiftTime: async (ms) => {
    await saveOffset(getClockOffsetMs() + ms);
    set({ status: 'Clock moved' });
  },

  jumpToLocalTime: async (hour, minute) => {
    const offset = offsetForLocalTime(systemClock.now(), getClockOffsetMs(), systemClock.timeZone(), hour, minute);
    await saveOffset(offset);
    set({ status: 'Clock moved' });
  },

  resetTime: async () => {
    await saveOffset(0);
    set({ status: 'Clock back to real time' });
  },

  loadScenario: async (name) => {
    const build = scenarios[name];
    if (!build) {
      set({ status: `Unknown scenario: ${name}` });
      return;
    }
    // Stand-in decks until real content is on the phone (M2).
    await writeScenario(await getDb(), build(appClock, fixtureContent()));
    set({ status: `Loaded scenario: ${name}` });
  },

  resetUserState: async () => {
    await resetUserState(await getDb());
    set({ status: 'User state wiped' });
  },
}));
