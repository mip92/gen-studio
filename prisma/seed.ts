/**
 * Entry point for `npx prisma db seed`.
 *
 * Each project has its own folder under seeds/.
 * Add new project seeds below in the desired run order.
 */
import { seedNightCourier } from './seeds/night_courier';

async function main() {
  await seedNightCourier();
  // await seedAnotherProject();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
