// Re-run skill tagging without reseeding: `npm run tag`.
// Use after editing keyword lists in src/curriculum/skills.ts.
import "dotenv/config";
import { tagSkillsForAllProblems } from "./seed";

tagSkillsForAllProblems()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
