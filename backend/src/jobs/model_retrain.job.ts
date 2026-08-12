import cron from 'node-cron';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { freightMatches } from '../db/schema/freight_matches';
import { eq, inArray } from 'drizzle-orm';

// Mock function for error monitoring integration (e.g. Sentry, Slack Webhook)
async function sendAlertToDevelopers(message: string, context?: any) {
  console.error('🚨 ALERT TO DEVELOPERS: ', message, context);
  // Implementation for real webhook/Sentry goes here
}

// Run daily at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running model retrain job...');
  try {
    // Check if there are at least 5,000 new un-trained freight match records
    const untrainedRecords = await db
      .select()
      .from(freightMatches)
      .where(eq(freightMatches.isTrained, false));
    
    if (untrainedRecords.length >= 5000) {
      console.log(`Found ${untrainedRecords.length} untrained records. Initiating retraining...`);
      
      const headers = [
        'required_weight_tons', 'transporter_capacity_tons', 'trip_distance_km', 
        'proximity_distance_km', 'proposed_cost_etb', 'historical_reliability_score', 
        'fuel_efficiency_score', 'match_accepted'
      ];
      
      let csvContent = headers.join(',') + '\n';
      for (const record of untrainedRecords) {
        const row = [
          record.requiredWeightTons,
          record.transporterCapacityTons,
          record.tripDistanceKm,
          record.proximityDistanceKm,
          record.proposedCostEtb,
          record.historicalReliabilityScore,
          record.fuelEfficiencyScore,
          record.matchAccepted ? 1 : 0
        ];
        csvContent += row.join(',') + '\n';
      }
      
      // Calculate the ai-engine directory path relative to this file
      // __dirname is backend/src/jobs
      const aiEnginePath = path.resolve(__dirname, '../../../../ai-engine');
      const csvPath = path.join(aiEnginePath, 'latest_training_data.csv');
      
      // Export records to latest_training_data.csv
      fs.writeFileSync(csvPath, csvContent);
      console.log(`Exported records to ${csvPath}`);
      
      // Trigger the Python script using child_process.exec
      // Adjust the python script name if necessary
      exec(`python retrain_model.py`, { cwd: aiEnginePath }, async (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing retrain script: ${error.message}`);
          await sendAlertToDevelopers('Model retraining script failed', { error: error.message, stderr });
          return;
        }
        if (stderr) {
          console.error(`Script stderr: ${stderr}`);
        }
        console.log(`Script stdout: ${stdout}`);
        
        // Update records to mark them as trained
        const recordIds = untrainedRecords.map(r => r.id);
        
        // Process in chunks to avoid too many parameters in SQL query
        for (let i = 0; i < recordIds.length; i += 1000) {
          const chunk = recordIds.slice(i, i + 1000);
          await db
            .update(freightMatches)
            .set({ isTrained: true })
            .where(inArray(freightMatches.id, chunk));
        }
        console.log('Successfully updated records to trained state.');
      });
    } else {
      console.log(`Not enough records for retraining (found ${untrainedRecords.length}, need 5,000).`);
    }
  } catch (error) {
    console.error('Failed to run model retrain job:', error);
    await sendAlertToDevelopers('Model retrain job crashed unexpectedly', { error });
  }
});
