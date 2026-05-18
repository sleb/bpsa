import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

export const PROJECT_ID = "bpsa26-5a752";
export const EDITOR_UID = "test-editor-uid";
export const EDITOR_USER = {
  role: "editor" as const,
  active: true,
  email: "editor@test.com",
  displayName: "Test Editor",
  provisionedAt: new Date(),
  provisionedBy: "admin",
};

export async function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "localhost",
      port: 8080,
    },
  });
}
