const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkCategories() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  console.log("\n=== ALL CATEGORIES (including inactive) ===\n");
  categories.forEach((cat) => {
    console.log(`${cat.name} (${cat.slug})`);
    console.log(`  Active: ${cat.isActive}`);
    console.log(`  Products: ${cat._count.products}`);
    console.log("");
  });

  await prisma.$disconnect();
}

checkCategories();
