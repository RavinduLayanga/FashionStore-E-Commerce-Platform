// backend/test-concurrency.js
const API_URL = "http://localhost:5001/api";

async function fireOrder(variantId, workerId) {
  const payload = {
    customerName: `Test Shopper ${workerId}`,
    email: `shopper${workerId}@example.com`,
    phone: "0771234567",
    address: "123 Load Test St",
    city: "Testville",
    paymentMethod: "WHATSAPP", // Bypasses PayHere redirect logic for the test
    items: [{ variantId, quantity: 1 }],
  };

  const startTime = Date.now();

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    const duration = Date.now() - startTime;

    return {
      workerId,
      status: res.status,
      success: data.success,
      message:
        data.message || (data.errors ? "Validation Failed" : "Unknown Error"),
      duration,
    };
  } catch (error) {
    return {
      workerId,
      status: 500,
      success: false,
      message: error.message,
      duration: Date.now() - startTime,
    };
  }
}

async function runTest() {
  const variantId = process.argv[2];
  const attempts = parseInt(process.argv[3]) || 10;

  if (!variantId) {
    console.error("Usage: node test-concurrency.js <variantId> <attempts>");
    console.error(
      "Example: node test-concurrency.js 123e4567-e89b-12d3-a456-426614174000 15",
    );
    process.exit(1);
  }

  console.log(
    `Firing ${attempts} parallel orders for variant: ${variantId}...`,
  );
  console.log(
    `(Note: Keep attempts under 20 to avoid triggering your rate limiter!)\n`,
  );

  const promises = [];
  for (let i = 1; i <= attempts; i++) {
    promises.push(fireOrder(variantId, i));
  }

  // Promise.all fires them concurrently
  const results = await Promise.all(promises);

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);
  const rateLimited = results.filter((r) =>
    r.message.includes("Too many orders"),
  );

  console.log("--- CONCURRENCY TEST RESULTS ---");
  console.log(`Total Attempts: ${attempts}`);
  console.log(`Successful Orders: ${successful.length}`);
  console.log(
    `Failed Orders (Oversell Prevented): ${failed.length - rateLimited.length}`,
  );
  if (rateLimited.length > 0) {
    console.log(`Rate Limited Requests: ${rateLimited.length}`);
  }

  console.log("\nDetailed Execution Log:");
  results.forEach((r) => {
    const statusLabel = r.success
      ? "[OK]"
      : r.message.includes("Too many")
        ? "[WARN]"
        : "[FAIL]";
    console.log(
      `${statusLabel} Worker ${r.workerId.toString().padStart(2, "0")}: [${r.status}] ${r.message} (${r.duration}ms)`,
    );
  });
}

runTest();
