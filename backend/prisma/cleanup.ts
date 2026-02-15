import { PrismaClient } from "@prisma/client";

const prisma: any = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning old data and user data...");

  await prisma.loginHistory.deleteMany({});
  await prisma.adminLog.deleteMany({});

  await prisma.couponUsage.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  await prisma.review.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.address.deleteMany({});

  await prisma.coupon.deleteMany({});
  await prisma.banner.deleteMany({});
  await prisma.page.deleteMany({});

  await prisma.user.deleteMany({
    where: {
      role: "CUSTOMER",
    },
  });

  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("✅ Cleanup complete.");
  console.log("- Removed old transactional data");
  console.log("- Removed all customer user data");
  console.log("- Kept admin/super admin users and system settings");
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
