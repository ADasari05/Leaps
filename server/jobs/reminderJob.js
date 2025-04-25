const cron = require('node-cron');
const db = require('../config/db');

// Run every 5 minutes
cron.schedule('*/1 * * * *', async () => {
  try {
    const now = new Date();

    // Adjust for potential DB timezone mismatch
    const dbNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const start = new Date(dbNow.getTime() + 24 * 60 * 60 * 1000 - 2 * 60 * 1000); // 24h - 2min
    const end = new Date(dbNow.getTime() + 24 * 60 * 60 * 1000 + 2 * 60 * 1000);   // 24h + 2min

    const startIso = start.toISOString();
    const endIso = end.toISOString();

    console.log(`\n🕒 Cron job running between ${startIso} and ${endIso}`);

    const query = `
      SELECT 
        u.id AS user_id,
        t.id AS trip_id,
        t.name AS trip_name,
        COALESCE(e.name, ce.name) AS event_name
      FROM trip_members tm
      JOIN users u ON u.id = tm.user_id
      JOIN trips t ON t.id = tm.trip_id
      JOIN trip_items ti ON ti.trip_id = t.id
      LEFT JOIN events e 
        ON ti.item_type IN ('event', 'events') 
        AND ti.item_id = e.id::TEXT 
        AND e.start_time BETWEEN $1 AND $2
      LEFT JOIN customevents ce 
        ON ti.item_type = 'custom-event' 
        AND ti.item_id = ce.id::TEXT 
        AND ce.start_time BETWEEN $1 AND $2
      WHERE e.id IS NOT NULL OR ce.id IS NOT NULL
    `;

    const { rows } = await db.query(query, [startIso, endIso]);

    console.log(`🔍 Found ${rows.length} matching upcoming events`);

    for (const row of rows) {
      const message = `Reminder: ${row.event_name} in "${row.trip_name}" is starting in 24 hours!`;

      // Check if notification already exists in the last 15 minutes
      const { rows: existing } = await db.query(
        `SELECT 1 FROM notifications 
         WHERE user_id = $1 AND trip_id = $2 AND message = $3`,
        [row.user_id, row.trip_id, message]
      );

      if (existing.length === 0) {
        await db.query(
          `INSERT INTO notifications (user_id, trip_id, type, message, is_read) 
                   VALUES ($1, $2, $3, $4, $5)`,
          [
            row.user_id,
            row.trip_id,
            'trip_update',
            message,
            false,
          ]
        );

        console.log(`📨 Notification sent to user ${row.user_id}: "${message}"`);
      } else {
        console.log(`row: ${row.message}`);
        console.log(`ℹ️ Notification already sent recently to user ${row.user_id}`);
      }
    }

    console.log(`✅ 24h reminders processed: ${rows.length}`);
  } catch (err) {
    console.error('❌ Failed to send 24h event reminders:', err);
  }
});
