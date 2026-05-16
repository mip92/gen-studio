/**
 * Entry point for `npx prisma db seed`.
 *
 * The original night_courier seed was removed once the database had been
 * populated and the source-JSON dependency on the external folder was cut.
 * Add new project seeds below in the desired run order when needed.
 */
async function main() {
  // Intentionally empty — no projects are seeded automatically.
  // Add `await seedYourProject()` here when you need bootstrap data.
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
