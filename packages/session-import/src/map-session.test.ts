import type { CategoryAll, SessionALl, SessionizeAll } from "sessionize_api";
import { describe, expect, it } from "vitest";
import { mapAllSessions } from "./map-session.js";

const categories: CategoryAll[] = [
  {
    id: 1,
    title: "Field",
    type: "Field",
    sort: 0,
    items: [{ id: 10, name: "Architecture" }],
  },
  {
    id: 2,
    title: "Session length",
    type: "Session length",
    sort: 1,
    items: [{ id: 20, name: "30 min" }],
  },
];

const session: SessionALl = {
  id: "abc",
  title: "Building blocks",
  description: "Talk description",
  startsAt: null,
  endsAt: null,
  isServiceSession: false,
  isPlenumSession: false,
  questionAnswers: [],
  roomId: null,
  liveUrl: null,
  recordingUrl: null,
  status: "Accepted",
  isInformed: true,
  isConfirmed: true,
  speakers: ["speaker-1"],
  categoryItems: [10, 20],
};

describe("mapAllSessions", () => {
  it("maps Field and session length when Sessionize uses generic type session", () => {
    const productionCategories: CategoryAll[] = [
      {
        id: 120992,
        title: "Field",
        type: "session",
        sort: 0,
        items: [{ id: 10, name: "Architecture" }],
      },
      {
        id: 120994,
        title: "Session length",
        type: "session",
        sort: 1,
        items: [{ id: 20, name: "30 min" }],
      },
    ];
    const data: SessionizeAll = {
      sessions: [{ ...session, categoryItems: [10, 20] }],
      speakers: [
        {
          id: "speaker-1",
          firstName: "Ada",
          lastName: "Lovelace",
          fullName: "Ada Lovelace",
          bio: null,
          tagLine: "",
          profilePicture: null,
          isTopSpeaker: false,
          links: [],
          sessions: [],
          categoryItems: [],
          questionAnswers: [],
        },
      ],
      questions: [],
      categories: productionCategories,
      rooms: [],
    };

    expect(mapAllSessions(data)[0]).toMatchObject({
      field: "Architecture",
      lengthMinutes: 30,
    });
  });

  it("maps Field and session length from Sessionize categories", () => {
    const data: SessionizeAll = {
      sessions: [session],
      speakers: [
        {
          id: "speaker-1",
          firstName: "Ada",
          lastName: "Lovelace",
          fullName: "Ada Lovelace",
          bio: null,
          tagLine: "",
          profilePicture: null,
          isTopSpeaker: false,
          links: [],
          sessions: [],
          categoryItems: [],
          questionAnswers: [],
        },
      ],
      questions: [],
      categories,
      rooms: [],
    };

    const mapped = mapAllSessions(data);
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({
      sessionizeId: "abc",
      title: "Building blocks",
      field: "Architecture",
      lengthMinutes: 30,
      isServiceSession: false,
      speakerNames: ["Ada Lovelace"],
      sessionizeStatus: "Accepted",
      status: "active",
    });
  });
});
