const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupGuests() {
  console.log('🧹 Mencari semua akun guest...');

  const guestUsers = await prisma.user.findMany({
    where:   { guestAccount: true },
    include: { player: true },
  });

  console.log(`   Ditemukan ${guestUsers.length} akun guest.`);
  if (guestUsers.length === 0) {
    console.log('✅ Tidak ada yang perlu dihapus.');
    await prisma.$disconnect();
    return;
  }

  for (const user of guestUsers) {
    const player = user.player;
    if (player) {
      await prisma.$transaction([
        prisma.gameRound.deleteMany({ where: { playerId: player.id } }),
        prisma.gameSession.deleteMany({ where: { playerId: player.id } }),
        prisma.rTPProfile.deleteMany({ where: { playerId: player.id } }),
        prisma.player.delete({ where: { id: player.id } }),
      ]);
    }
    await prisma.user.delete({ where: { id: user.id } });
    process.stdout.write(`  ✓ Dihapus: ${user.username}\n`);
  }

  console.log(`\n✅ Selesai — ${guestUsers.length} akun guest dihapus.`);
  await prisma.$disconnect();
}

cleanupGuests().catch((e) => {
  console.error(e);
  process.exit(1);
});