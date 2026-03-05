const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const cat = await prisma.category.upsert({
    where: { slug: "hair-oil" },
    update: { name: "Hair Oil", isActive: true },
    create: {
      name: "Hair Oil",
      slug: "hair-oil",
      description: "Premium Ayurvedic Hair Oil collection",
      isActive: true,
    },
  });
  console.log("Category:", cat.id, cat.name);

  const prod = await prisma.product.upsert({
    where: { sku: "EXO-HAIROIL-50ML" },
    update: {
      price: 350,
      comparePrice: 1300,
      stock: 100,
      categoryId: cat.id,
      isActive: true,
    },
    create: {
      name: "EXOVITA Hair Oil - The Heritage Collection",
      slug: "exovita-hair-oil-heritage-collection",
      description:
        "Our Ayurvedic Hair Oil is a carefully crafted blend of time-tested herbs and natural ingredients inspired by traditional Ayurvedic wisdom. Enriched with Neem, Aloe Vera, Hibiscus, Amla and Bhringraj, this oil deeply nourishes the scalp and strengthens hair from root to tip.",
      price: 350,
      comparePrice: 1300,
      stock: 100,
      sku: "EXO-HAIROIL-50ML",
      isActive: true,
      categoryId: cat.id,
      images: [],
      tags: ["hair oil", "ayurvedic", "herbal", "50ml"],
    },
  });
  console.log("Product:", prod.id, prod.name, "Rs." + prod.price);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
