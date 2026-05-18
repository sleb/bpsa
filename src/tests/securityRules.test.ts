import { test, expect, beforeAll, afterAll, beforeEach, describe } from "bun:test";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";

const PROJECT_ID = "bpsa26-5a752";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// Helper: seed a user doc via admin context (bypasses rules)
async function seedUser(
  uid: string,
  role: "editor" | "admin",
  active: boolean
) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users", uid), {
      role,
      active,
      email: `${uid}@test.com`,
      displayName: uid,
      provisionedAt: new Date(),
      provisionedBy: "admin",
    });
  });
}

async function seedSchedule(dayId: string) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "schedules", dayId), {
      entries: [],
      draftEntries: [],
      hasDraft: false,
      publishedVersion: 0,
      publishedAt: null,
      publishedBy: null,
      draftLastEditedAt: null,
      draftLastEditedBy: null,
    });
  });
}

describe("schedules collection", () => {
  beforeEach(() => seedSchedule("2026-06-18"));

  test("unauthenticated user can read schedule", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(ctx.firestore(), "schedules", "2026-06-18")));
  });

  test("unauthenticated user cannot write schedule", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(
      updateDoc(doc(ctx.firestore(), "schedules", "2026-06-18"), { hasDraft: true })
    );
  });

  test("authenticated user with no users/ doc cannot write schedule", async () => {
    const ctx = testEnv.authenticatedContext("unknown-uid");
    await assertFails(
      updateDoc(doc(ctx.firestore(), "schedules", "2026-06-18"), { hasDraft: true })
    );
  });

  test("inactive editor cannot write schedule", async () => {
    await seedUser("inactive-editor", "editor", false);
    const ctx = testEnv.authenticatedContext("inactive-editor");
    await assertFails(
      updateDoc(doc(ctx.firestore(), "schedules", "2026-06-18"), { hasDraft: true })
    );
  });

  test("active editor can write schedule", async () => {
    await seedUser("active-editor", "editor", true);
    const ctx = testEnv.authenticatedContext("active-editor");
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), "schedules", "2026-06-18"), { hasDraft: true })
    );
  });

  test("active admin can write schedule", async () => {
    await seedUser("admin-user", "admin", true);
    const ctx = testEnv.authenticatedContext("admin-user");
    await assertSucceeds(
      updateDoc(doc(ctx.firestore(), "schedules", "2026-06-18"), { hasDraft: true })
    );
  });
});

describe("schedules/{dayId}/versions subcollection", () => {
  beforeEach(async () => {
    await seedSchedule("2026-06-18");
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "schedules", "2026-06-18", "versions", "v0001"), {
        versionNumber: 1,
        publishedAt: new Date(),
        publishedBy: "some-uid",
        publisherDisplayName: "Editor",
        entries: [],
      });
    });
  });

  test("unauthenticated user can read version docs", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertSucceeds(
      getDocs(collection(ctx.firestore(), "schedules", "2026-06-18", "versions"))
    );
  });

  test("unauthenticated user cannot write version docs", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(
      setDoc(doc(ctx.firestore(), "schedules", "2026-06-18", "versions", "v0002"), {
        versionNumber: 2, publishedAt: new Date(), publishedBy: "x",
        publisherDisplayName: "X", entries: [],
      })
    );
  });

  test("active editor can write version docs", async () => {
    await seedUser("active-editor", "editor", true);
    const ctx = testEnv.authenticatedContext("active-editor");
    await assertSucceeds(
      setDoc(doc(ctx.firestore(), "schedules", "2026-06-18", "versions", "v0002"), {
        versionNumber: 2, publishedAt: new Date(), publishedBy: "active-editor",
        publisherDisplayName: "Editor", entries: [],
      })
    );
  });

  test("inactive editor cannot write version docs", async () => {
    await seedUser("inactive-editor", "editor", false);
    const ctx = testEnv.authenticatedContext("inactive-editor");
    await assertFails(
      setDoc(doc(ctx.firestore(), "schedules", "2026-06-18", "versions", "v0002"), {
        versionNumber: 2, publishedAt: new Date(), publishedBy: "inactive-editor",
        publisherDisplayName: "Old Editor", entries: [],
      })
    );
  });
});

describe("users collection", () => {
  beforeEach(() => seedUser("target-uid", "editor", true));

  test("user can read their own document", async () => {
    const ctx = testEnv.authenticatedContext("target-uid");
    await assertSucceeds(getDoc(doc(ctx.firestore(), "users", "target-uid")));
  });

  test("user cannot read another user's document", async () => {
    const ctx = testEnv.authenticatedContext("other-uid");
    await assertFails(getDoc(doc(ctx.firestore(), "users", "target-uid")));
  });

  test("unauthenticated user cannot read any user document", async () => {
    const ctx = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(ctx.firestore(), "users", "target-uid")));
  });

  test("no client can write to users collection", async () => {
    const ctx = testEnv.authenticatedContext("target-uid");
    await assertFails(
      updateDoc(doc(ctx.firestore(), "users", "target-uid"), { role: "admin" })
    );
  });

  test("admin cannot write users via client SDK either", async () => {
    await seedUser("admin-user", "admin", true);
    const ctx = testEnv.authenticatedContext("admin-user");
    await assertFails(
      updateDoc(doc(ctx.firestore(), "users", "target-uid"), { active: false })
    );
  });
});
