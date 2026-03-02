import prisma from "@/lib/prisma";

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDecimal(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(9 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 60));
  return date;
}

function futureDate(fromDate: Date, daysAhead: number): Date {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  return date;
}

async function main() {
  console.log("Limpando banco de dados...");
  await prisma.auditLog.deleteMany();
  await prisma.supplierPanel.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderProduct.deleteMany();
  await prisma.order.deleteMany();
  await prisma.conversionMessage.deleteMany();
  await prisma.form.deleteMany();
  await prisma.productSupplier.deleteMany();
  await prisma.coverageArea.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.session.deleteMany();
  await prisma.city.deleteMany();

  console.log("Criando cidades...");
  const cities = await Promise.all([
    prisma.city.create({ data: { ibge: "3550308", name: "São Paulo", uf: "SP" } }),
    prisma.city.create({ data: { ibge: "3304557", name: "Rio de Janeiro", uf: "RJ" } }),
    prisma.city.create({ data: { ibge: "3106200", name: "Belo Horizonte", uf: "MG" } }),
    prisma.city.create({ data: { ibge: "4106902", name: "Curitiba", uf: "PR" } }),
    prisma.city.create({ data: { ibge: "4314902", name: "Porto Alegre", uf: "RS" } }),
    prisma.city.create({ data: { ibge: "5300108", name: "Brasília", uf: "DF" } }),
  ]);

  console.log("Criando usuários...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Carlos Admin",
        email: "carlos@empresa.com",
        role: "ADMIN",
        helenaId: "helena_carlos",
      },
    }),
    prisma.user.create({
      data: {
        name: "Ana Vendedora",
        email: "ana@empresa.com",
        role: "SELLER",
        helenaId: "helena_ana",
      },
    }),
    prisma.user.create({
      data: {
        name: "Bruno Vendedor",
        email: "bruno@empresa.com",
        role: "SELLER",
        helenaId: "helena_bruno",
      },
    }),
    prisma.user.create({
      data: {
        name: "Daniela Supervisora",
        email: "daniela@empresa.com",
        role: "SUPERVISOR",
        helenaId: "helena_daniela",
      },
    }),
  ]);

  const sellers = users.filter((u) => u.role === "SELLER" || u.role === "SUPERVISOR");

  console.log("Criando fornecedores...");
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "Flora Bella",
        email: "contato@florabella.com",
        phone: "11999001100",
        cnpj: "12345678000100",
        isRatified: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Jardim das Flores",
        email: "contato@jardimflores.com",
        phone: "21988112233",
        cnpj: "98765432000199",
        isRatified: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Orquídea Floricultura",
        email: "contato@orquidea.com",
        phone: "31977223344",
        cnpj: "11223344000155",
        isRatified: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Pétalas & Cia",
        email: "contato@petalas.com",
        phone: "41966334455",
        cnpj: "55667788000122",
        isRatified: false,
      },
    }),
  ]);

  console.log("Criando produtos e variantes...");

  const colors = [
    "DEFAULT", "YELLOW", "BLUE", "WHITE", "CHAMPAGNE",
    "MULTICOLOR", "ORANGE", "LILAC", "PINK", "ROSE",
    "PURPLE", "RED",
  ] as const;

  const sizes = ["UNIQUE", "SMALL", "MEDIUM", "LARGE"] as const;

  const productsData = [
    { name: "Buquê de Rosas", basePrice: 189.9 },
    { name: "Arranjo Tropical", basePrice: 259.9 },
    { name: "Cesta de Flores do Campo", basePrice: 139.9 },
    { name: "Coroa de Flores", basePrice: 450.0 },
    { name: "Buquê de Girassóis", basePrice: 89.9 },
  ];

  const allVariants: Array<{
    id: string;
    productName: string;
    price: number;
  }> = [];

  for (const pData of productsData) {
    const product = await prisma.product.create({
      data: {
        name: pData.name,
        basePrice: pData.basePrice,
      },
    });

    const variantCount = 2 + Math.floor(Math.random() * 3);
    const usedCombos = new Set<string>();

    for (let v = 0; v < variantCount; v++) {
      let color: (typeof colors)[number];
      let size: (typeof sizes)[number];

      do {
        color = randomItem([...colors]);
        size = randomItem([...sizes]);
      } while (usedCombos.has(`${color}-${size}`));

      usedCombos.add(`${color}-${size}`);

      const priceOffset = randomDecimal(-30, 80);
      const variantPrice = Math.max(pData.basePrice + priceOffset, 50);

      const variant = await prisma.productVariant.create({
        data: {
          active: Math.random() > 0.1,
          productId: product.id,
          color,
          size,
          price: variantPrice,
          imageUrl: `https://placeholder.com/${pData.name.toLowerCase().replace(/ /g, "-")}-${color.toLowerCase()}-${size.toLowerCase()}.jpg`,
        },
      });

      allVariants.push({
        id: variant.id,
        productName: pData.name,
        price: variantPrice,
      });
    }
  }

  console.log(`  ${allVariants.length} variantes criadas`);

  console.log("Criando relações variante-fornecedor...");
  for (const supplier of suppliers) {
    for (const variant of allVariants) {
      if (Math.random() > 0.3) {
        await prisma.productSupplier.create({
          data: {
            supplierId: supplier.id,
            variantId: variant.id,
            amount: randomDecimal(50, 200),
            rating: Math.floor(Math.random() * 5) + 1,
          },
        });
      }
    }
  }

  console.log("Criando áreas de cobertura...");
  for (const supplier of suppliers) {
    await prisma.coverageArea.create({
      data: {
        name: `Região ${supplier.name}`,
        freight: randomDecimal(15, 60),
        start: 1000000,
        end: 99999999,
        supplierId: supplier.id,
      },
    });
  }

  const firstNames = [
    "Maria", "João", "Ana", "Pedro", "Juliana",
    "Lucas", "Fernanda", "Rafael", "Camila", "Gabriel",
    "Patrícia", "Thiago", "Larissa", "Marcos", "Isabela",
    "Ricardo", "Beatriz", "Felipe", "Aline", "Gustavo",
  ];

  const lastNames = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues",
    "Ferreira", "Almeida", "Pereira", "Lima", "Costa",
  ];

  const contactOrigins: Array<"WHATSAPP" | "PHONE" | "NONE"> = ["WHATSAPP", "PHONE", "NONE"];
  const deliveryPeriods: Array<"MORNING" | "AFTERNOON" | "EVENING" | "EXPRESS"> = ["MORNING", "AFTERNOON", "EVENING", "EXPRESS"];
  const paymentTypes: Array<"PIX" | "CARD_CREDIT" | "BOLETO" | "PIX_CNPJ" | "MONEY"> = ["PIX", "CARD_CREDIT", "BOLETO", "PIX_CNPJ", "MONEY"];
  const paymentStatuses: Array<"PAID" | "ACTIVE" | "PROCESSING" | "CANCELLED"> = ["PAID", "PAID", "PAID", "ACTIVE", "PROCESSING", "CANCELLED"];
  const supplierPaymentStatuses: Array<"PAID" | "WAITING"> = ["PAID", "PAID", "WAITING"];
  const orderStatuses: Array<"FINALIZED" | "DELIVERING_DELIVERED" | "CANCELLED"> = ["FINALIZED", "FINALIZED", "FINALIZED", "DELIVERING_DELIVERED", "CANCELLED"];
  const tributeCardTypes = ["Parabéns", "Com Amor", "Saudades", "Homenagem", "Sem Cartão"];

  console.log("Criando 20 pedidos...");

  for (let i = 0; i < 20; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const fullName = `${firstName} ${lastName}`;
    const city = randomItem(cities);
    const supplier = randomItem(suppliers);
    const seller = randomItem(sellers);
    const orderDate = randomDate(60);
    const personType = Math.random() > 0.7 ? "PJ" as const : "PF" as const;
    const taxId = personType === "PF"
      ? String(Math.floor(Math.random() * 99999999999)).padStart(11, "0")
      : String(Math.floor(Math.random() * 99999999999999)).padStart(14, "0");

    const variant = randomItem(allVariants);
    const saleAmount = variant.price + randomDecimal(-10, 40);
    const costAmount = randomDecimal(40, saleAmount * 0.7);

    const contact = await prisma.contact.create({
      data: {
        name: fullName,
        phone: `11${String(Math.floor(Math.random() * 999999999)).padStart(9, "0")}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
        personType,
        taxId,
        zipCode: 1000000 + Math.floor(Math.random() * 89999999),
        address: `Rua ${randomItem(["das Flores", "dos Lírios", "das Orquídeas", "dos Girassóis", "das Violetas"])}`,
        addressNumber: String(Math.floor(Math.random() * 2000) + 1),
        addressComplement: Math.random() > 0.5 ? `Apto ${Math.floor(Math.random() * 200) + 1}` : "",
        neighboorhood: randomItem(["Centro", "Jardim América", "Vila Mariana", "Copacabana", "Savassi", "Batel"]),
        ibge: city.ibge,
      },
    });

    const form = await prisma.form.create({
      data: {
        type: randomItem(["SITE_SALE", "FORM_FN", "MANUAL"] as const),
        status: "CONVERTED",
        name: fullName,
        email: contact.email,
        phone: contact.phone,
        sellerHelenaId: seller.helenaId,
        isCustomer: Math.random() > 0.5,
        createdAt: orderDate,
      },
    });

    const orderStatus = randomItem(orderStatuses);
    const supplierPaymentStatus = randomItem(supplierPaymentStatuses);

    const order = await prisma.order.create({
      data: {
        contactOrigin: randomItem(contactOrigins),
        orderStatus,
        deliveryPeriod: randomItem(deliveryPeriods),
        deliveryUntil: futureDate(orderDate, 5),
        formId: form.id,
        userId: seller.id,
        honoreeName: Math.random() > 0.3 ? randomItem(firstNames) + " " + randomItem(lastNames) : fullName,
        tributeCardPhrase: Math.random() > 0.4 ? randomItem(["Feliz Aniversário!", "Com muito carinho", "Saudades eternas", "Parabéns pelo dia!", "Te amo!"]) : null,
        tributeCardType: randomItem(tributeCardTypes),
        deliveryZipCode: contact.zipCode,
        deliveryAddress: contact.address,
        deliveryAddressNumber: contact.addressNumber,
        deliveryNeighboorhood: contact.neighboorhood,
        ibge: city.ibge,
        supplierNote: Math.random() > 0.5 ? "Entregar no portão" : "",
        contactId: contact.id,
        supplierPaymentStatus,
        createdAt: orderDate,
      },
    });

    await prisma.orderProduct.create({
      data: {
        orderId: order.id,
        variantId: variant.id,
      },
    });

    if (Math.random() > 0.7) {
      const extraVariant = randomItem(allVariants.filter((v) => v.id !== variant.id));
      if (extraVariant) {
        await prisma.orderProduct.create({
          data: {
            orderId: order.id,
            variantId: extraVariant.id,
          },
        });
      }
    }

    const paymentStatus = randomItem(paymentStatuses);

    await prisma.payment.create({
      data: {
        amount: saleAmount,
        status: paymentStatus,
        type: randomItem(paymentTypes),
        orderId: order.id,
        paidAt: paymentStatus === "PAID" ? futureDate(orderDate, 3) : null,
      },
    });

    await prisma.supplierPanel.create({
      data: {
        status: orderStatus === "CANCELLED" ? "CANCELLED" : "CONFIRMED",
        supplierId: supplier.id,
        orderId: order.id,
        expireAt: futureDate(orderDate, 2),
        cost: costAmount,
        freight: randomDecimal(10, 50),
        receiverName: order.honoreeName,
        deliveredAt: orderStatus === "FINALIZED" || orderStatus === "DELIVERING_DELIVERED"
          ? futureDate(orderDate, 4)
          : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        type: "CREATION",
        author: seller.name,
        action: "Pedido criado",
        description: `Pedido #${i + 1} criado para ${fullName}`,
        orderId: order.id,
        createdAt: orderDate,
      },
    });

    console.log(`  Pedido ${i + 1}/20: ${fullName} - ${variant.productName} - R$${saleAmount.toFixed(2)}`);
  }

  console.log("\nSeed finalizado com sucesso!");
  console.log(`  - ${cities.length} cidades`);
  console.log(`  - ${users.length} usuários`);
  console.log(`  - ${suppliers.length} fornecedores`);
  console.log(`  - ${productsData.length} produtos com ${allVariants.length} variantes`);
  console.log(`  - 20 pedidos com contatos, formulários, pagamentos e painéis`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });