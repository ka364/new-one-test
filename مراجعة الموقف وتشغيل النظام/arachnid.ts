  private async detectFrequencyAnomaly(transaction: any): Promise<number> {
    if (!transaction.userId) return 0;

    try {
      const db = await (await import("../db")).getDb();
      if (!db) return 0;
      const { transactions } = await import("../../drizzle/schema");
      const { eq, and, gte } = await import("drizzle-orm");

      // Check transactions in last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      const recentTxs = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, transaction.userId),
            gte(transactions.createdAt, tenMinutesAgo)
          )
        );

      const count = recentTxs.length;

      if (count < 3) return 0;
      if (count >= 10) return 100;
      return ((count - 3) / 7) * 100;
    } catch (error) {
      console.error("[Arachnid] Error detecting frequency anomaly:", error);
      return 0;